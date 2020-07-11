using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
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
                endpoints.MapGet("/data/{idx:int}/json", GetData);

                endpoints.MapGet("/data/{idx:int}/refresh", RefreshData);

                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticfiles");
                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticexternal");

                endpoints.MapGet("/data/{idx:int}/video/{id}/thumb",  VideoController.GetThumbnail);
                endpoints.MapGet("/data/{idx:int}/video/{id}/seek",   VideoController.GetVideoSeek);
                endpoints.MapGet("/data/{idx:int}/video/{id}/file",   VideoController.GetVideoFile);
                endpoints.MapGet("/data/{idx:int}/video/{id}/stream", VideoController.GetVideoStream);

                endpoints.MapRazorPages();
            });
        }

        private static async Task GetData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(Program.Data[idx].json);
        }

        private static async Task RefreshData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            var json = Program.RefreshData(idx);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(json);
        }
    }
}