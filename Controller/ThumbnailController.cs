using System;
using System.IO;
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
        private static string GetPreviewCachePath(string pathVideo)
        {
            if (pathVideo == null) return null;
            if (Program.CacheDir == null) return null;
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

                await GetPreviewImage(context, pathVideo, 0);
                return;
            }

            
            var pathCache = GetPreviewCachePath(pathVideo);
            if (pathCache != null && !File.Exists(pathCache) && Program.HasValidFFMPEG)
            {
                // ensure that for all videos the previews are pre-generated
                // so we don't have to start ffmpeg when we first hover
                JobRegistry.GetOrQueuePreviewGenJob(pathVideo, pathCache).Dispose(); // runs as background job
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

            await GetPreviewImage(context, pathVideo, 0);
        }

        public static async Task GetPreview(HttpContext context)
        {
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

            if (!File.Exists(pathCache))
            {
                using var proxy = JobRegistry.GetOrQueuePreviewGenJob(videopath, pathCache); // [!] pathCache can be null

                while (!proxy.Job.GenFinished) await Task.Delay(50);

                if (proxy.Job.ImageData == null)             { context.Response.StatusCode = 500; return; }
                if (proxy.Job.ImageData.Count <= imageIndex) { context.Response.StatusCode = 500; return; }

                await context.Response.BodyWriter.WriteAsync(proxy.Job.ImageData[imageIndex]);
                return;
            }
            
            await using var fs = new FileStream(pathCache, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            long dataoffset = int.MinValue;
            int  datalength = int.MinValue;
            using (var br = new BinaryReader(fs, Encoding.UTF8, true))
            {
                var count = br.ReadByte();
            
                if (count <= imageIndex) { context.Response.StatusCode = 500; return; }

                for (var i = 0; i < imageIndex+1; i++)
                {
                    dataoffset = br.ReadInt64();
                    datalength = br.ReadInt32();
                }
            }

            fs.Seek(dataoffset, SeekOrigin.Begin);

            var databin = new byte[datalength];
            fs.Read(databin, 0, datalength);
            await context.Response.BodyWriter.WriteAsync(databin);
        }
    }
}