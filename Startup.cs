using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRazorPages();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            //if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            app.UseStaticFiles();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/data", GetData);

                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticfiles");
                
                endpoints.MapGet("/thumb/{id}", GetThumbnail);
                
                endpoints.MapGet("/video/{id}/seek", GetVideoSeek);
                
                endpoints.MapGet("/video/{id}/file", GetVideoFile);
                
                endpoints.MapGet("/video/{id}/stream", GetVideoStream);
                
                endpoints.MapRazorPages();
            });
        }

        private static async Task GetThumbnail(HttpContext context)
        {
            var id = (string)context.Request.RouteValues["id"];

            if (!Program.Data.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathThumbnail = obj["meta"]?.Value<string>("path_thumbnail");
            if (pathThumbnail == null) { context.Response.StatusCode = 404; return; }

            var data = await File.ReadAllBytesAsync(pathThumbnail);
            
            context.Response.Headers.Add(HeaderNames.ContentLength, data.Length.ToString());
            context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=" + Path.GetFileName(pathThumbnail));
            
            if (Path.GetExtension(pathThumbnail).Equals(".png", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/png");
            if (Path.GetExtension(pathThumbnail).Equals(".svg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
            if (Path.GetExtension(pathThumbnail).Equals(".jpg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).Equals(".jpeg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).Equals(".webp", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/webp");
            
            await context.Response.BodyWriter.WriteAsync(data);
        }

        private static async Task GetData(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            
            await context.Response.WriteAsync(Program.DataJSON);
        }

        private static async Task GetVideoFile(HttpContext context)
        {
            var id = (string)context.Request.RouteValues["id"];

            if (!Program.Data.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            if (pathVideo == null) { context.Response.StatusCode = 404; return; }
            
            Stream iStream = null;

            try {
                // Open the file.
                iStream = new FileStream(pathVideo, FileMode.Open, FileAccess.Read, FileShare.Read);

                // Total bytes to read:
                var dataToRead = iStream.Length;

                context.Response.Headers.Add(HeaderNames.ContentLength, dataToRead.ToString());
                context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=" + Path.GetFileName(pathVideo));
                
                var buffer = new byte[4096];
                while (dataToRead > 0) 
                {
                    if (!context.RequestAborted.IsCancellationRequested) 
                    {
                        await iStream.ReadAsync(buffer, 0, buffer.Length);

                        await context.Response.BodyWriter.WriteAsync(buffer);

                        await context.Response.BodyWriter.FlushAsync();

                        buffer = new byte[buffer.Length];
                        
                        dataToRead = dataToRead - buffer.Length;
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
        
        private static async Task GetVideoSeek(HttpContext context)
        {
            var id = (string)context.Request.RouteValues["id"];

            if (!Program.Data.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            if (pathVideo == null) { context.Response.StatusCode = 404; return; }
            
            Stream iStream = null;

            try {
                // Open the file.
                iStream = new FileStream(pathVideo, FileMode.Open, FileAccess.Read, FileShare.Read);

                // Total bytes to read:
                var dataToRead = iStream.Length;

                context.Response.Headers.Add("Accept-Ranges", "bytes");
                
                if (Path.GetExtension(pathVideo).Equals(".mp4",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/mp4");
                if (Path.GetExtension(pathVideo).Equals(".mkv",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/x-matroska");
                if (Path.GetExtension(pathVideo).Equals(".webm", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/webm");
                if (Path.GetExtension(pathVideo).Equals(".avi",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/avi");
                if (Path.GetExtension(pathVideo).Equals(".flv",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/flv");
                if (Path.GetExtension(pathVideo).Equals(".wmv",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/wmv");
                if (Path.GetExtension(pathVideo).Equals(".mpg",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/mpeg");
                if (Path.GetExtension(pathVideo).Equals(".mpeg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "video/mpeg");
            
                context.Response.Headers.Add(HeaderNames.ContentType, "video/webm"); // https://stackoverflow.com/a/27243561/1761622

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
                        await iStream.ReadAsync(buffer, 0, buffer.Length);

                        await context.Response.BodyWriter.WriteAsync(buffer);
                        await context.Response.BodyWriter.FlushAsync();

                        buffer = new byte[buffer.Length];
                        
                        dataToRead = dataToRead - buffer.Length;
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

        private static async Task GetVideoStream(HttpContext context)
        {
            var id = (string)context.Request.RouteValues["id"];

            if (!Program.Data.TryGetValue(id, out var obj)) { context.Response.StatusCode = 404; return; }

            var pathVideo = obj["meta"]?.Value<string>("path_video");
            if (pathVideo == null) { context.Response.StatusCode = 404; return; }

            var pathTemp = Path.Combine(Path.GetTempPath(), "yt_dl_v_" + Guid.NewGuid().ToString("B")+".webm");

            try
            {
                var cmd = $"-ss 00:00:00 -i \"{pathVideo}\" -vcodec libvpx -acodec libvorbis -b:a 96k -deadline realtime -speed 4 -f webm {pathTemp}";

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
                        if (!proc.HasExited) proc.Kill();
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
                        if (!proc.HasExited) proc.Kill();
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
                        if (procFinished) return;
                    }
                }
            }
            finally
            {
                if (File.Exists(pathTemp)) File.Delete(pathTemp);
            }
        }
    }
}