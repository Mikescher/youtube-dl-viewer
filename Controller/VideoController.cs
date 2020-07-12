using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class VideoController
    {
        public static async Task GetThumbnail(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!Program.Data[idx].obj.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathThumbnail = obj["meta"]?.Value<string>("path_thumbnail");
            if (pathThumbnail == null) { context.Response.StatusCode = 404; return; }

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

            var pathCache = (Program.CacheDir == null) ? null : Path.Combine(Program.CacheDir, pathVideo.Sha256() + ".webm");

            if (pathCache != null && File.Exists(pathCache))
            {
                await GetSeekableFile(context, pathCache);
                return;
            }
            
            var pathTemp = Path.Combine(Path.GetTempPath(), "yt_dl_v_" + Guid.NewGuid().ToString("B")+".webm");

            try
            {
                var cmd = $" -i \"{pathVideo}\" -f webm -vcodec libvpx-vp9 -vb 256k -cpu-used -5 -deadline realtime {pathTemp}";

                var proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "ffmpeg",
                        Arguments = cmd,
                        CreateNoWindow = true,
                    }
                };

                context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
            
                proc.Start();

                while (!File.Exists(pathTemp))
                {
                    if (context.RequestAborted.IsCancellationRequested)
                    {
                        if (!proc.HasExited) proc.Kill(true);
                        return;
                    }
                
                    if (proc.HasExited && !File.Exists(pathTemp)) return;
                    await Task.Delay(0);
                }
            
                await using var fs = new FileStream(pathTemp, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

                var buffer = new byte[4096];
                for (;;)
                {
                    if (context.RequestAborted.IsCancellationRequested)
                    {
                        if (!proc.HasExited) proc.Kill(true);
                        return;
                    }
                
                    var procFinished = proc.HasExited;
                
                    var read = await fs.ReadAsync(buffer);

                    if (read > 0)
                    {
                        await context.Response.BodyWriter.WriteAsync(buffer.AsMemory(0, read));
                        await context.Response.BodyWriter.FlushAsync();
                    }
                    else
                    {
                        if (procFinished)
                        {
                            if (pathCache != null)
                            {
                                for (var i = 0; i < 15; i++) // 15 retries
                                {
                                    try
                                    {
                                        try { fs.Close(); } catch (Exception) { /* ignore */ }
                                        File.Move(pathTemp, pathCache);
                                        break;
                                    }
                                    catch (IOException)
                                    {
                                        await Task.Delay(2 * 1000);
                                    }
                                }
                            }

                            return;
                        }
                    }
                }
            }
            finally
            {
                for (var i = 0; i < 5; i++) // 5 retries
                {
                    try
                    {
                        if (File.Exists(pathTemp)) File.Delete(pathTemp);
                        break;
                    }
                    catch (IOException)
                    {
                        await Task.Delay(5 * 1000);
                    }
                }
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