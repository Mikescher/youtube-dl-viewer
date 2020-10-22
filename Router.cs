using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer
{
    public static class Router
    {
        public static void Build(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapGet("/data/{idx:int}/json", DataController.GetData);

            endpoints.MapGet("/data/{idx:int}/refresh", DataController.RefreshData);

            endpoints.MapJSEmbeddedBundle("/script_main.compiled.js", "youtube_dl_viewer.staticfiles", new[]
            {
                "script_seedrandom.js", "script_comphelper.js", "script_util.js", 
                "script_display_grid.js", "script_display_compact.js", "script_display_detailed.js", "script_display_tabular.js",
                "script_userinterface.js", "script_videolist.js", 
                "script_mainpage.js"
            });
            
            endpoints.MapJSEmbeddedBundle("/script_jobs.compiled.js", "youtube_dl_viewer.staticfiles", new[]
            {
                "script_util.js", 
                "script_jobs.js"
            });
            
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
        }

        private static async Task RouteFallback(HttpContext context)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsync("Not found");
        }
    }
}