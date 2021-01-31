using System;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Web;
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
            if (Program.Args.CacheDir == null) return null;
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return Path.Combine(Program.Args.CacheDir, "prev_" + Path.GetRelativePath(Program.CurrentDir, pathVideo).ToLower().Sha256() + ".dat");
            else
                return Path.Combine(Program.Args.CacheDir, "prev_" + pathVideo.Sha256() + ".dat");
        }
        
        public static async Task GetThumbnail(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("DataDirIndex not found"); return; }

            var pathVideo = vid.PathVideo;
            
            var pathThumbnail = vid.PathThumbnail;
            if (vid.PathThumbnail == null)
            {
                if (pathVideo == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video file not found"); return; }

                await GetPreviewImage(context, pathVideo, idx, id, 1);
                return;
            }

            
            var pathCache = GetPreviewCachePath(pathVideo);
            if (Program.Args.AutoPreviewGen && pathCache != null && Program.HasValidFFMPEG && !File.Exists(pathCache))
            {
                // ensure that for all videos the previews are pre-generated
                // so we don't have to start ffmpeg when we first hover
                JobRegistry.PreviewGenJobs.StartOrQueue((man) => new PreviewGenJob(man, pathVideo, pathCache, null, idx, id), false); // runs as background job
            }
            
            var data = await File.ReadAllBytesAsync(pathThumbnail);
            
            context.Response.Headers.Add(HeaderNames.ContentLength, WebUtility.UrlEncode(data.Length.ToString()));
            context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=\"" + WebUtility.UrlEncode(Path.GetFileName(pathThumbnail))+"\"");

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

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("DataDirIndex not found"); return; }

            await GetPreviewImage(context, vid.PathVideo, idx, id, 1);
        }

        public static async Task GetPreview(HttpContext context)
        {
            if (Program.Args.CacheDir == null) { context.Response.StatusCode = 400; await context.Response.WriteAsync("No cache directory specified"); return; }
            
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];
            var img = int.Parse((string)context.Request.RouteValues["img"]);

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("DataDirIndex not found"); return; }

            await GetPreviewImage(context, vid.PathVideo, idx, id, img);
        }
        
        private static async Task GetPreviewImage(HttpContext context, string videopath, int datadirindex, string videouid, int imageIndex)
        {
            if (!Program.HasValidFFMPEG) { context.Response.StatusCode = 400; await context.Response.WriteAsync("No ffmpeg installation found"); return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");

            var pathCache = GetPreviewCachePath(videopath);

            if (pathCache == null)
            {
                using (var proxy = JobRegistry.PreviewGenJobs.StartOrQueue((man) => new PreviewGenJob(man, videopath, null, imageIndex, datadirindex, videouid)))
                {
                    while (proxy.JobRunningOrWaiting) await Task.Delay(50);

                    if (proxy.Killed)                            { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
                    
                    if (proxy.Job.ImageData == null)             { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job returned no image data (1)"); return; }
                    if (proxy.Job.ImageCount == null)            { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job returned no image data (2)"); return; }

                    context.Response.Headers.Add("PreviewImageCount", WebUtility.UrlEncode(proxy.Job.ImageCount.Value.ToString()));
                    context.Response.Headers.Add("PathCache", WebUtility.UrlEncode("null"));
                    context.Response.Headers.Add("PathVideo", WebUtility.UrlEncode(videopath));
                    await context.Response.BodyWriter.WriteAsync(proxy.Job.ImageData);
                    return;
                }
            }
            
            if (!File.Exists(pathCache))
            {
                using (var proxy = JobRegistry.PreviewGenJobs.StartOrQueue((man) => new PreviewGenJob(man, videopath, pathCache, null, datadirindex, videouid)))
                {
                    while (proxy.JobRunningOrWaiting) await Task.Delay(50);
                }
            }
            
            if (!File.Exists(pathCache)) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job did not output cache file"); return; }

            long dataoffset = int.MinValue;
            int  datalength = int.MinValue;
            int prevcount;
            byte[] databin;
            
            await using (var fs = new FileStream(pathCache, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                using (var br = new BinaryReader(fs, Encoding.UTF8, true))
                {
                    prevcount = br.ReadByte();
            
                    if (prevcount <= imageIndex) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Index not found in preview gallery"); return; }

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
            
            context.Response.Headers.Add("PreviewImageCount", WebUtility.UrlEncode(prevcount.ToString()));
            context.Response.Headers.Add("PathCache", WebUtility.UrlEncode(pathCache));
            context.Response.Headers.Add("PathVideo", WebUtility.UrlEncode(videopath));
            await context.Response.BodyWriter.WriteAsync(databin);
        }
    }
}