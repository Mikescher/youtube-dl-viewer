using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Jobs;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class ThumbnailController
    {
        public static string GetPreviewCachePath(string pathVideo)
        {
            if (pathVideo == null) return null;
            if (Program.CacheDir == null) return null;
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return Path.Combine(Program.CacheDir, "prev_" + Path.GetRelativePath(Program.CurrentDir, pathVideo).ToLower().Sha256() + ".dat");
            else
                return Path.Combine(Program.CacheDir, "prev_" + pathVideo.Sha256() + ".dat");
        }
        
        public static async Task GetThumbnail(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            
            var pathThumbnail = obj["meta"]?.Value<string>("path_thumbnail");
            if (pathThumbnail == null)
            {
                if (pathVideo == null) { context.Response.StatusCode = 404; return; }

                await GetPreviewImage(context, pathVideo, 1);
                return;
            }

            
            var pathCache = GetPreviewCachePath(pathVideo);
            if (Program.AutoPreviewGen && pathCache != null && Program.HasValidFFMPEG && !File.Exists(pathCache))
            {
                // ensure that for all videos the previews are pre-generated
                // so we don't have to start ffmpeg when we first hover
                JobRegistry.PreviewGenJobs.StartOrQueue(pathVideo, (man) => new PreviewGenJob(man, pathVideo, pathCache, null), false); // runs as background job
            }
            
            var data = await File.ReadAllBytesAsync(pathThumbnail);
            
            context.Response.Headers.Add(HeaderNames.ContentLength, data.Length.ToString());
            context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=" + Path.GetFileName(pathThumbnail));

            if (Path.GetExtension(pathThumbnail).Equals(".png",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/png");
            if (Path.GetExtension(pathThumbnail).Equals(".svg",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
            if (Path.GetExtension(pathThumbnail).Equals(".jpg",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).Equals(".jpeg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).Equals(".webp", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/webp");
            
            await context.Response.BodyWriter.WriteAsync(data);
        }

        public static async Task GetAutoThumbnail(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");

            await GetPreviewImage(context, pathVideo, 1);
        }

        public static async Task GetPreview(HttpContext context)
        {
            if (Program.CacheDir == null) { context.Response.StatusCode = 400; return; }
            
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];
            var img = int.Parse((string)context.Request.RouteValues["img"]);

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");

            await GetPreviewImage(context, pathVideo, img);
        }
        
        private static async Task GetPreviewImage(HttpContext context, string videopath, int imageIndex)
        {
            if (!Program.HasValidFFMPEG) { context.Response.StatusCode = 400; return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");

            var pathCache = GetPreviewCachePath(videopath);

            if (pathCache == null)
            {
                using (var proxy = JobRegistry.PreviewGenJobs.StartOrQueue(videopath, (man) => new PreviewGenJob(man, videopath, null, imageIndex)))
                {
                    while (!proxy.Killed && !proxy.Job.GenFinished) await Task.Delay(50);

                    if (proxy.Killed)                            { context.Response.StatusCode = 500; return; }
                    
                    if (proxy.Job.ImageData == null)             { context.Response.StatusCode = 500; return; }
                    if (proxy.Job.ImageCount == null)            { context.Response.StatusCode = 500; return; }

                    context.Response.Headers.Add("PreviewImageCount", proxy.Job.ImageCount.Value.ToString());
                    context.Response.Headers.Add("PathCache", "null");
                    context.Response.Headers.Add("PathVideo", videopath);
                    await context.Response.BodyWriter.WriteAsync(proxy.Job.ImageData);
                    return;
                }
            }
            
            if (!File.Exists(pathCache))
            {
                using (var proxy = JobRegistry.PreviewGenJobs.StartOrQueue(videopath, (man) => new PreviewGenJob(man, videopath, pathCache, null)))
                {
                    while (!proxy.Killed && !proxy.Job.GenFinished) await Task.Delay(50);
                }
            }
            
            if (!File.Exists(pathCache)) { context.Response.StatusCode = 500; return; }

            long dataoffset = int.MinValue;
            int  datalength = int.MinValue;
            int prevcount;
            byte[] databin;
            
            await using (var fs = new FileStream(pathCache, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                using (var br = new BinaryReader(fs, Encoding.UTF8, true))
                {
                    prevcount = br.ReadByte();
            
                    if (prevcount <= imageIndex) { context.Response.StatusCode = 500; return; }

                    for (var i = 0; i < imageIndex+1; i++)
                    {
                        dataoffset = br.ReadInt64();
                        datalength = br.ReadInt32();
                    }
                }

                fs.Seek(dataoffset, SeekOrigin.Begin);

                databin = new byte[datalength];
                fs.Read(databin, 0, datalength);
            }
            
            context.Response.Headers.Add("PreviewImageCount", prevcount.ToString());
            context.Response.Headers.Add("PathCache", pathCache);
            context.Response.Headers.Add("PathVideo", videopath);
            await context.Response.BodyWriter.WriteAsync(databin);
        }
    }
}