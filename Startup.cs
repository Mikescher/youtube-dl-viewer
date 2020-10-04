using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRazorPages();
            
            services.AddLogging(c => c.ClearProviders());
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
#if DEBUG
            app.UseDeveloperExceptionPage();
#endif
            app.UseExceptionHandler(errorApp =>
            {
                errorApp.Run(async context =>
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "text/plain";

                    var err = context.Features.Get<IExceptionHandlerPathFeature>()?.Error;
                    if (err == null)
                    {
                        await context.Response.WriteAsync("Error == null");
                    }
                    else
                    {
                        await context.Response.WriteAsync(err.Message + "\n\n");
                        await context.Response.WriteAsync(err.GetType() + "\n\n");
                        await context.Response.WriteAsync(err + "\n\n");
                    }

                    await Console.Error.WriteLineAsync();
                    await Console.Error.WriteLineAsync($"[E] Exception thrown: ({err?.GetType()}): '{err?.Message}'\n{err?.StackTrace}");
                    await Console.Error.WriteLineAsync();
                });
            });

            app.UseRouting();
            
            app.UseMiddleware<CronMiddleware>();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/data/{idx:int}/json", DataController.GetData);

                endpoints.MapGet("/data/{idx:int}/refresh", DataController.RefreshData);

                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticfiles");
                endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticexternal");

                endpoints.MapGet("/data/{idx:int}/video/{id}/thumb",      ThumbnailController.GetThumbnail);
                endpoints.MapGet("/data/{idx:int}/video/{id}/thumbframe", ThumbnailController.GetAutoThumbnail);
                endpoints.MapGet("/data/{idx:int}/video/{id}/prev/{img}", ThumbnailController.GetPreview);
                
                endpoints.MapGet("/data/{idx:int}/video/{id}/seek",   VideoController.GetVideoSeek);
                endpoints.MapGet("/data/{idx:int}/video/{id}/file",   VideoController.GetVideoFile);
                endpoints.MapGet("/data/{idx:int}/video/{id}/stream", VideoController.GetVideoStream);
                
                endpoints.MapGet("/jobmanager/list",                                            JobController.List);
                endpoints.MapGet("/jobmanager/start/generatePreviews/{selector1}/{selector2}",  JobController.ManuallyForcePreviewJobs);
                endpoints.MapGet("/jobmanager/start/generateTranscode/{selector1}/{selector2}", JobController.ManuallyForceTranscodeJobs);
                endpoints.MapGet("/jobmanager/start/collectData/{idx}",                         JobController.ManuallyForceCollectData);
                endpoints.MapGet("/jobmanager/abort/{jobid}",                                   JobController.AbortJob);
                endpoints.MapGet("/jobmanager/clearFinished",                                   JobController.ClearFinishedJobs);
                
                endpoints.MapGet("/themes/{idx:int}", ThemeController.GetTheme);

                endpoints.MapRazorPages();

                endpoints.MapFallback(RouteFallback);
            });
        }

        private async Task RouteFallback(HttpContext context)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsync("Not found");
        }
    }
}