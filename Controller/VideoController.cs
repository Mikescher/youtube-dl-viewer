using System;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web;
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
            if (Program.Args.CacheDir == null) return null;
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return Path.Combine(Program.Args.CacheDir, "stream_" + Path.GetRelativePath(Program.CurrentDir, pathVideo).ToLower().Sha256() + ".webm");
            else
                return Path.Combine(Program.Args.CacheDir, "stream_" + pathVideo.Sha256() + ".webm");
        }
        
        public static async Task GetVideoFile(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            var pathVideo = vid.PathVideo;
            if (pathVideo == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video file not found"); return; }
            
            Stream iStream = null;

            try {
                // Open the file.
                iStream = new FileStream(pathVideo, FileMode.Open, FileAccess.Read, FileShare.Read);

                // Total bytes to read:
                var dataToRead = iStream.Length;

                context.Response.Headers.Add(HeaderNames.ContentLength, WebUtility.UrlEncode(dataToRead.ToString()));
                context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=\"" + WebUtility.UrlEncode(Path.GetFileName(pathVideo))+"\"");
                
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

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            var pathVideo = vid.PathVideo;
            if (pathVideo == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video file not found"); return; }

            await GetSeekableFile(context, pathVideo);
        }

        public static async Task GetVideoStream(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            var pathVideo = vid.PathVideo;
            if (pathVideo == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video file not found"); return; }

            var pathCache = GetStreamCachePath(pathVideo);
            
            if (pathCache != null && File.Exists(pathCache))
            {
                await GetSeekableFile(context, pathCache);
                return;
            }
            
            if (pathCache != null) 
                await GetVideoStreamWithCache(context, pathVideo, pathCache, idx, id);
            else                     
                await GetVideoStreamWithoutCache(context, pathVideo, idx, id);
        }

        private static async Task GetVideoStreamWithCache(HttpContext context, string pathVideo, string pathCache, int datadirindex, string videouid)
        {
            if (!Program.HasValidFFMPEG) { context.Response.StatusCode = 400; await context.Response.WriteAsync("No ffmpeg installation found"); return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
            
            using var proxy = JobRegistry.ConvertJobs.StartOrQueue((man) => new ConvertJob(man, pathVideo, pathCache, datadirindex, videouid)); 

            while (proxy.JobRunningOrWaiting && !File.Exists(proxy.Job.Temp)) await Task.Delay(0);
            
            if (proxy.Killed)                        { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
            if (proxy.Job.State == JobState.Aborted) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was aborted"); return; }
            if (proxy.Job.State == JobState.Failed)  { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job failed"); return; }
                
            await using var fs = new FileStream(proxy.Job.Temp, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            try
            {
                var buffer = new byte[4096];
                for (;;)
                {
                    if (proxy.Killed) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
                    
                    if (proxy.Job.State == JobState.Aborted) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was aborted"); return; }
                    if (proxy.Job.State == JobState.Failed) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job failed"); return; }
                    
                    var finished = proxy.Job.State == JobState.Finished || proxy.Job.State == JobState.Success;
                    var read = await fs.ReadAsync(buffer);

                    if (read > 0)
                    {
                        if (context.RequestAborted.IsCancellationRequested) return;
                    
                        await context.Response.BodyWriter.WriteAsync(buffer.AsMemory(0, read));
                        await context.Response.BodyWriter.FlushAsync();
                    }
                    else
                    {
                        if (finished) return;
                    }
                }
            }
            finally
            {
                try { fs?.Close(); } catch (Exception) { /* ignore */ }
            }
        }

        private static async Task GetVideoStreamWithoutCache(HttpContext context, string pathVideo, int datadirindex, string videouid)
        {
            if (!Program.HasValidFFMPEG) { context.Response.StatusCode = 400; await context.Response.WriteAsync("No ffmpeg installation found"); return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
            
            using var proxy = JobRegistry.ConvertJobs.StartOrQueue((man) => new ConvertJob(man, pathVideo, null, datadirindex, videouid)); 

            while (proxy.JobRunningOrWaiting && !File.Exists(proxy.Job.Temp)) await Task.Delay(0);
            
            if (proxy.Killed)                        { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
            if (proxy.Job.State == JobState.Aborted) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was aborted"); return; }
            if (proxy.Job.State == JobState.Failed)  { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job failed"); return; }

            await using var fs = new FileStream(proxy.Job.Temp, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            try
            {
                var buffer = new byte[4096];
                for (;;)
                {
                    if (proxy.Killed) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
                    
                    if (proxy.Job.State == JobState.Aborted) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was aborted"); return; }
                    if (proxy.Job.State == JobState.Failed) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job failed"); return; }
                    
                    var finished = proxy.Job.State == JobState.Finished || proxy.Job.State == JobState.Success;
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
                        if (finished) return;
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
                    var range = context.Request.Headers[HeaderNames.Range].ToString().Split('=', '-');
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