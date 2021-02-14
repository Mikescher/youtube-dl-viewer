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
        public static readonly (string,string)[] JS_MAIN =
        {
            ("youtube_dl_viewer.staticfiles", "script_seedrandom.js"), 
            ("youtube_dl_viewer.staticfiles", "script_comphelper.js"), 
            ("youtube_dl_viewer.staticfiles", "script_util.js"), 
            ("youtube_dl_viewer.staticfiles", "script_display_grid.js"), 
            ("youtube_dl_viewer.staticfiles", "script_display_compact.js"), 
            ("youtube_dl_viewer.staticfiles", "script_display_detailed.js"), 
            ("youtube_dl_viewer.staticfiles", "script_display_tabular.js"), 
            ("youtube_dl_viewer.staticfiles", "script_display_timeline.js"),
            ("youtube_dl_viewer.staticfiles", "script_userinterface.js"), 
            ("youtube_dl_viewer.staticfiles", "script_videolist.js"), 
            ("youtube_dl_viewer.staticfiles", "script_player.js"), 
            ("youtube_dl_viewer.staticfiles", "script_thumbnails.js"), 
            ("youtube_dl_viewer.staticfiles", "script_mainpage.js"),
        };
        
        public static readonly (string,string)[] JS_JOBS =
        {
            ("youtube_dl_viewer.staticfiles", "script_util.js"), 
            ("youtube_dl_viewer.staticfiles", "script_jobs.js"),
        };
        
        public static readonly (string,string)[] JS_CONFIG =
        {
            ("youtube_dl_viewer.staticfiles", "script_util.js"), 
            ("youtube_dl_viewer.staticfiles", "script_config.js"),
        };
        
        public static readonly (string,string)[] JS_DATA =
        {
            ("youtube_dl_viewer.staticexternal", "lodash.js"), 
            ("youtube_dl_viewer.staticexternal", "hyperlist.js"), 
#if DEBUG
            ("youtube_dl_viewer.staticexternal", "Sortable.js"), 
            ("youtube_dl_viewer.staticexternal", "frappe-datatable.js"), 
#else
            ("youtube_dl_viewer.staticexternal", "Sortable.min.js"), 
            ("youtube_dl_viewer.staticexternal", "frappe-datatable.min.js"), 
#endif
            
            ("youtube_dl_viewer.staticfiles", "script_util.js"), 
            ("youtube_dl_viewer.staticfiles", "script_data.js"),
        };
        
        public static readonly (string,string)[] CSS_MAIN =
        {
#if DEBUG
            ("youtube_dl_viewer.staticexternal", "fontawesome.css"),
            ("youtube_dl_viewer.staticexternal", "solid.css"),
            ("youtube_dl_viewer.staticexternal", "regular.css"),
#else
            ("youtube_dl_viewer.staticexternal", "fontawesome.min.css"),
            ("youtube_dl_viewer.staticexternal", "solid.min.css"),
            ("youtube_dl_viewer.staticexternal", "regular.min.css"),
#endif
                
            ("youtube_dl_viewer.staticfiles", "style.css"), 
            ("youtube_dl_viewer.staticfiles", "style_animation.css"), 
            ("youtube_dl_viewer.staticfiles", "style_width.css"), 
            ("youtube_dl_viewer.staticfiles", "style_video.css"), 
                
            ("youtube_dl_viewer.staticfiles", "style_compact.css"), 
            ("youtube_dl_viewer.staticfiles", "style_detailed.css"), 
            ("youtube_dl_viewer.staticfiles", "style_detailed_expanded.css"), 
            ("youtube_dl_viewer.staticfiles", "style_grid.css"), 
            ("youtube_dl_viewer.staticfiles", "style_tabular.css"), 
            ("youtube_dl_viewer.staticfiles", "style_timeline.css"), 
        };
        
        public static readonly (string,string)[] CSS_JOBS =
        {
#if DEBUG
            ("youtube_dl_viewer.staticexternal", "fontawesome.css"),
            ("youtube_dl_viewer.staticexternal", "solid.css"),
            ("youtube_dl_viewer.staticexternal", "regular.css"),
#else
            ("youtube_dl_viewer.staticexternal", "fontawesome.min.css"),
            ("youtube_dl_viewer.staticexternal", "solid.min.css"),
            ("youtube_dl_viewer.staticexternal", "regular.min.css"),
#endif
                
            ("youtube_dl_viewer.staticfiles", "style_jobs.css"), 
        };
        
        public static readonly (string,string)[] CSS_CONFIG =
        {
#if DEBUG
            ("youtube_dl_viewer.staticexternal", "fontawesome.css"),
            ("youtube_dl_viewer.staticexternal", "solid.css"),
            ("youtube_dl_viewer.staticexternal", "regular.css"),
#else
            ("youtube_dl_viewer.staticexternal", "fontawesome.min.css"),
            ("youtube_dl_viewer.staticexternal", "solid.min.css"),
            ("youtube_dl_viewer.staticexternal", "regular.min.css"),
#endif
                
            ("youtube_dl_viewer.staticfiles", "style_config.css"), 
        };
        
        public static readonly (string,string)[] CSS_DATA =
        {
#if DEBUG
            ("youtube_dl_viewer.staticexternal", "fontawesome.css"),
            ("youtube_dl_viewer.staticexternal", "solid.css"),
            ("youtube_dl_viewer.staticexternal", "regular.css"),
            
            ("youtube_dl_viewer.staticexternal", "frappe-datatable.css"),
#else
            ("youtube_dl_viewer.staticexternal", "fontawesome.min.css"),
            ("youtube_dl_viewer.staticexternal", "solid.min.css"),
            ("youtube_dl_viewer.staticexternal", "regular.min.css"),
            
            ("youtube_dl_viewer.staticexternal", "frappe-datatable.min.css"),
#endif
                
            ("youtube_dl_viewer.staticfiles", "style_data.css"), 
        };
        
        public static void Build(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapGet("/data/{idx:int}/json",    DataController.GetData);
            endpoints.MapGet("/data/{idx:int}/refresh", DataController.RefreshData);

            endpoints.MapJSEmbeddedBundle("/script_main.compiled.js",   JS_MAIN);
            endpoints.MapJSEmbeddedBundle("/script_jobs.compiled.js",   JS_JOBS);
            endpoints.MapJSEmbeddedBundle("/script_config.compiled.js", JS_CONFIG);
            endpoints.MapJSEmbeddedBundle("/script_data.compiled.js",   JS_DATA);
            
            endpoints.MapCSSEmbeddedBundle("/style_main.combined.css",   CSS_MAIN);
            endpoints.MapCSSEmbeddedBundle("/style_jobs.combined.css",   CSS_JOBS);
            endpoints.MapCSSEmbeddedBundle("/style_config.combined.css", CSS_CONFIG);
            endpoints.MapCSSEmbeddedBundle("/style_data.combined.css",   CSS_DATA);
            
            endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticfiles");
            endpoints.MapEmbeddedResources("/", "youtube_dl_viewer.staticexternal");

            endpoints.MapGet("/data/{idx:int}/video/{id}/thumb/original",    ThumbnailController.GetThumbnailOriginal);
            endpoints.MapGet("/data/{idx:int}/video/{id}/thumb/{size}/fast", ThumbnailController.GetThumbnailFast);
            endpoints.MapGet("/data/{idx:int}/video/{id}/thumb/{size}/wait", ThumbnailController.GetThumbnailWait);
            
            endpoints.MapGet("/data/{idx:int}/video/{id}/thumbframe", PreviewController.GetAutoThumbnail);
            endpoints.MapGet("/data/{idx:int}/video/{id}/prev/{img}", PreviewController.GetPreview);
                
            endpoints.MapGet("/data/{idx:int}/video/{id}/seek",   VideoController.GetVideoSeek);
            endpoints.MapGet("/data/{idx:int}/video/{id}/file",   VideoController.GetVideoFile);
            endpoints.MapGet("/data/{idx:int}/video/{id}/stream", VideoController.GetVideoStream);
            
            endpoints.MapGet("/data/dump", DataDumpController.ListData);
                
            endpoints.MapGet("/jobmanager/list",                                             JobController.List);
            endpoints.MapGet("/jobmanager/start/generatePreviews/{selector1}/{selector2}",   JobController.ManuallyForcePreviewJobs);
            endpoints.MapGet("/jobmanager/start/generateThumbnails/{selector1}/{selector2}", JobController.ManuallyForceThumbnailJobs);
            endpoints.MapGet("/jobmanager/start/generateTranscode/{selector1}/{selector2}",  JobController.ManuallyForceTranscodeJobs);
            endpoints.MapGet("/jobmanager/start/collectData/{idx}",                          JobController.ManuallyForceCollectData);
            endpoints.MapGet("/jobmanager/abort/{jobid}",                                    JobController.AbortJob);
            endpoints.MapGet("/jobmanager/clearFinished",                                    JobController.ClearFinishedJobs);
                
            endpoints.MapGet("/themes/{idx:int}",        ThemeController.GetTheme);
            endpoints.MapGet("/themes/{idx:int}/{name}", ThemeController.GetTheme);
            
            endpoints.MapGet("/config/list", ConfigController.ListConfig);


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