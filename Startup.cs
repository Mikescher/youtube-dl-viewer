using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Controller;
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
#if DEBUG
            app.UseDeveloperExceptionPage();
#endif

            app.UseRouting();

            app.UseStaticFiles();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/data", GetData);
                
                endpoints.MapGet("/refresh", RefreshData);

                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticfiles");
                
                endpoints.MapGet("/video/{id}/thumb",  VideoController.GetThumbnail);
                endpoints.MapGet("/video/{id}/seek",   VideoController.GetVideoSeek);
                endpoints.MapGet("/video/{id}/file",   VideoController.GetVideoFile);
                endpoints.MapGet("/video/{id}/stream", VideoController.GetVideoStream);
                
                endpoints.MapRazorPages();
            });
        }

        private static async Task GetData(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            
            await context.Response.WriteAsync(Program.DataJSON);
        }

        private static async Task RefreshData(HttpContext context)
        {
            Program.RefreshData();
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(Program.DataJSON);
        }
    }
}