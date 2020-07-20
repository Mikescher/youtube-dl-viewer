using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Jobs;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class VideoController
    {
        public static string GetStreamCachePath(string pathVideo)
        {
            if (Program.CacheDir == null) return null;
            
            if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                return Path.Combine(Program.CacheDir, "stream_" + Path.GetRelativePath(Program.CurrentDir, pathVideo).ToLower().Sha256() + ".webm");
            else
                return Path.Combine(Program.CacheDir, "stream_" + pathVideo.Sha256() + ".webm");
        }
        
        public static async Task GetVideoFile(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            if (pathVideo == null) { context.Response.StatusCode = 404; return; }
            
            Stream iStream = null;

            try {
                // Open the file.
                iStream = new FileStream(pathVideo, FileMode.Open, FileAccess.Read, FileShare.Read);

                // Total bytes to read:
                var dataToRead = iStream.Length;

                context.Response.Headers.Add(HeaderNames.ContentLength, dataToRead.ToString());
                context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=\"" + Path.GetFileName(pathVideo)+"\"");
                
                var buffer = new byte[4096];
                for(;;) 
                {
                    var read = await iStream.ReadAsync(buffer, 0, buffer.Length);
                    await context.Response.BodyWriter.WriteAsync(buffer.AsMemory(0, read));
                    await context.Response.BodyWriter.FlushAsync();

                    if (read == 0) return;
                    if (context.RequestAborted.IsCancellationRequested) return;
                }
            }
            catch (Exception ex) 
            {
                await context.Response.WriteAsync("Error : " + ex.Message);
            }
            finally
            {
                iStream?.Close();
            }
        }
        
        public static async Task GetVideoSeek(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            if (pathVideo == null) { context.Response.StatusCode = 404; return; }

            await GetSeekableFile(context, pathVideo);
        }

        public static async Task GetVideoStream(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            if (pathVideo == null) { context.Response.StatusCode = 404; return; }

            var pathCache = GetStreamCachePath(pathVideo);
            
            if (pathCache != null && File.Exists(pathCache))
            {
                await GetSeekableFile(context, pathCache);
                return;
            }
            
            if (pathCache != null) 
                await GetVideoStreamWithCache(context, pathVideo, pathCache);
            else                     
                await GetVideoStreamWithoutCache(context, pathVideo);
        }

        private static async Task GetVideoStreamWithCache(HttpContext context, string pathVideo, string pathCache)
        {
            if (!Program.HasValidFFMPEG) { context.Response.StatusCode = 400; return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
            
            using var proxy = JobRegistry.GetOrStartConvertJob(pathVideo, pathCache);

            while (!File.Exists(proxy.Job.Temp))
            {
                if (!proxy.Job.Running) return;
                await Task.Delay(0);
            }
                
            await using var fs = new FileStream(proxy.Job.Temp, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            try
            {
                var buffer = new byte[4096];
                for (;;)
                {
                    var convertFin = proxy.Job.ConvertFinished;
                    
                    var read = await fs.ReadAsync(buffer);

                    if (read > 0)
                    {
                        if (context.RequestAborted.IsCancellationRequested) return;
                    
                        await context.Response.BodyWriter.WriteAsync(buffer.AsMemory(0, read));
                        await context.Response.BodyWriter.FlushAsync();
                    }
                    else
                    {
                        if (convertFin) return;
                    }
                }
            }
            finally
            {
                try { fs?.Close(); } catch (Exception) { /* ignore */ }
            }
        }

        private static async Task GetVideoStreamWithoutCache(HttpContext context, string pathVideo)
        {
            if (!Program.HasValidFFMPEG) { context.Response.StatusCode = 400; return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
            
            using var proxy = JobRegistry.GetOrStartConvertJob(pathVideo, null);

            while (!File.Exists(proxy.Job.Temp))
            {
                if (!proxy.Job.Running) return;
                await Task.Delay(0);
            }
                
            await using var fs = new FileStream(proxy.Job.Temp, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            try
            {
                var buffer = new byte[4096];
                for (;;)
                {
                    var convertFin = proxy.Job.ConvertFinished;
                    
                    var read = await fs.ReadAsync(buffer);

                    if (read > 0)
                    {
                        if (context.RequestAborted.IsCancellationRequested)
                        {
                            proxy.Job.Abort();
                            return;
                        }
                    
                        await context.Response.BodyWriter.WriteAsync(buffer.AsMemory(0, read));
                        await context.Response.BodyWriter.FlushAsync();
                    }
                    else
                    {
                        if (convertFin) return;
                    }
                }
            }
            finally
            {
                try { fs?.Close(); } catch (Exception) { /* ignore */ }
            }
        }

        private static async Task GetSeekableFile(HttpContext context, string filepath)
        {
            Stream iStream = null;

            try {
                // Open the file.
                iStream = new FileStream(filepath, FileMode.Open, FileAccess.Read, FileShare.Read);

                // Total bytes to read:
                var dataToRead = iStream.Length;

                context.Response.Headers.Add("Accept-Ranges", "bytes");
                
                if (Path.GetExtension(filepath).Equals(".mp4",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/mp4");
                if (Path.GetExtension(filepath).Equals(".mkv",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/x-matroska");
                if (Path.GetExtension(filepath).Equals(".webm", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
                if (Path.GetExtension(filepath).Equals(".avi",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/avi");
                if (Path.GetExtension(filepath).Equals(".flv",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/flv");
                if (Path.GetExtension(filepath).Equals(".wmv",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/wmv");
                if (Path.GetExtension(filepath).Equals(".mpg",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/mpeg");
                if (Path.GetExtension(filepath).Equals(".mpeg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/mpeg");
            
                if (!string.IsNullOrEmpty(context.Request.Headers[HeaderNames.Range])) 
                {
                    var range = context.Request.Headers[HeaderNames.Range].ToString().Split(new[] { '=', '-' });
                    var startbyte = int.Parse(range[1]);
                    iStream.Seek(startbyte, SeekOrigin.Begin);

                    context.Response.StatusCode = 206;
                    context.Response.Headers.Add(HeaderNames.ContentRange, $" bytes {startbyte}-{dataToRead - 1}/{dataToRead}");
                }

                var buffer = new byte[4096];
                while (dataToRead > 0) 
                {
                    if (!context.RequestAborted.IsCancellationRequested) 
                    {
                        var len = await iStream.ReadAsync(buffer, 0, (int)Math.Min(dataToRead, buffer.Length));

                        await context.Response.BodyWriter.WriteAsync(buffer.AsMemory(0, len));
                        await context.Response.BodyWriter.FlushAsync();

                        if (len == 0) return;
                        
                        dataToRead -= len;
                    } else {
                        //prevent infinite loop if user disconnects
                        dataToRead = -1;
                    }
                }
            }
            catch (Exception ex) 
            {
                await context.Response.WriteAsync("Error : " + ex.Message);
            }
            finally
            {
                iStream?.Close();
            }
        }
    }
}