using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
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

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/data/{idx:int}/json", DataController.GetData);

                endpoints.MapGet("/data/{idx:int}/refresh", DataController.RefreshData);

                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticfiles");
                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticexternal");

                endpoints.MapGet("/data/{idx:int}/video/{id}/thumb",  ThumbnailController.GetThumbnail);
                
                endpoints.MapGet("/data/{idx:int}/video/{id}/seek",   VideoController.GetVideoSeek);
                endpoints.MapGet("/data/{idx:int}/video/{id}/file",   VideoController.GetVideoFile);
                endpoints.MapGet("/data/{idx:int}/video/{id}/stream", VideoController.GetVideoStream);

                endpoints.MapRazorPages();
            });
        }
    }
}