using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer.Controller
{
    public static class JobController
    {
        public static async Task List(HttpContext context)
        {
            var jobs = JobRegistry.Managers
                .SelectMany(p => p.ListJobsAsJson())
                .OrderBy(p =>
                {
                    if (p["QueueName"].Value<string>() == "Active")   return 0;
                    if (p["QueueName"].Value<string>() == "Queued")   return 1;
                    if (p["QueueName"].Value<string>() == "Finished") return 2;
                    return 3;
                })
                .ThenByDescending(p => p["StartTime"].Value<string>())
                .ToList();

            var vidcache = Program.GetAllCachedData();
            
            var r = new JObject
            (
                new JProperty("Meta", new JObject
                (
                    new JProperty("Jobs", new JObject
                    (
                        new JProperty("CountActive", JobRegistry.Managers.Sum(p => p.CountActive)),
                        new JProperty("CountQueued", JobRegistry.Managers.Sum(p => p.CountQueued))
                    )),
                    
                    new JProperty("Videos", new JObject
                    (
                        new JProperty("CountCachedPreviews", vidcache.Count(p => p["meta"]["cached_previews"].Value<bool>())),
                        new JProperty("CountCachedVideos",   vidcache.Count(p => p["meta"]["cached"].Value<bool>())),
                        new JProperty("CountTotal",          vidcache.Count),
                        
                        new JProperty("FilesizeCachedPreviews", vidcache.Sum(p => p["meta"]["cached_preview_fsize"].Value<long>())),
                        new JProperty("FilesizeCachedVideos",   vidcache.Sum(p => p["meta"]["cached_video_fsize"].Value<long>()))
                    )),
                    
                    new JProperty("CountActive", JobRegistry.Managers.Sum(p => p.CountActive)),
                    new JProperty("CountQueued", JobRegistry.Managers.Sum(p => p.CountQueued))
                )),
                new JProperty("Managers", new JArray(JobRegistry.Managers.Select(p => p.ObjectAsJson()))),
                new JProperty("Jobs", new JArray(jobs))
            );
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(r.ToString(Formatting.Indented));
        }

        public static async Task ManuallyForcePreviewJobs(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "text/plain");
            
            if (!Program.HasValidFFMPEG)  { context.Response.StatusCode = 500; await context.Response.WriteAsync("No ffmpeg installation found"); return; }
            if (Program.Args.CacheDir == null) { context.Response.StatusCode = 500; await context.Response.WriteAsync("No cache directory specified"); return; }

            var selector1 = (string)context.Request.RouteValues["selector1"];
            var selector2 = (string)context.Request.RouteValues["selector2"];

            List<(string json, Dictionary<string, JObject> obj)> selection1;
            if (selector1.ToLower() == "all" || selector1.ToLower() == "*")
            {
                selection1 = (await Task.WhenAll(Program.Args.DataDirs.Select(async (_, i) => await Program.GetData(i)))).ToList();
            }
            else
            {
                selection1 = new[]{ (await Program.GetData(int.Parse(selector1))) }.ToList();
            }
            
            List<JObject> selection2;
            if (selector2.ToLower() == "all" || selector2.ToLower() == "*")
            {
                selection2 = selection1.Select(p => p.obj).SelectMany(p => p.Values).ToList();
            }
            else
            {
                selection2 = selection1.SelectMany(p => p.obj).Where(p => p.Key == selector2).Select(p => p.Value).ToList();
            }

            var count = 0;
            foreach (var obj in selection2)
            {
                var pathVideo = obj["meta"]?.Value<string>("path_video");
                if (pathVideo == null) { continue; }
                
                var pathCache = ThumbnailController.GetPreviewCachePath(pathVideo);

                if (File.Exists(pathCache)) continue;
                
                count++;
                JobRegistry.PreviewGenJobs.StartOrQueue((man) => new PreviewGenJob(man, pathVideo, pathCache, null, obj["meta"].Value<int>("datadirindex"), obj["meta"].Value<string>("uid")), false);
            }
            
            await context.Response.WriteAsync($"Started/Attached {count} new jobs");
        }

        public static async Task ManuallyForceTranscodeJobs(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "text/plain");
            
            if (!Program.HasValidFFMPEG)  { context.Response.StatusCode = 500; await context.Response.WriteAsync("No ffmpeg installation found"); return; }
            if (Program.Args.CacheDir == null) { context.Response.StatusCode = 500; await context.Response.WriteAsync("No cache directory specified"); return; }

            var selector1 = (string)context.Request.RouteValues["selector1"];
            var selector2 = (string)context.Request.RouteValues["selector2"];

            List<(DataDirSpec, (string json, Dictionary<string, JObject> obj))> selection1;
            if (selector1.ToLower() == "all" || selector1.ToLower() == "*")
            {
                selection1 = (await Task.WhenAll(Program.Args.DataDirs.Select(async (s, i) => (s, await Program.GetData(i))))).ToList();
            }
            else
            {
                selection1 = new[]{ (Program.Args.DataDirs[int.Parse(selector1)], await Program.GetData(int.Parse(selector1))) }.ToList();
            }
            
            List<(DataDirSpec, JObject)> selection2;
            if (selector2.ToLower() == "all" || selector2.ToLower() == "*")
            {
                selection2 = selection1.SelectMany(p => p.Item2.obj.Values.Select(q => (p.Item1, q))).ToList();
            }
            else
            {
                selection2 = selection1.SelectMany(p => p.Item2.obj.Select(q => (p.Item1, q))).Where(p => p.Item2.Key == selector2).Select(p => (p.Item1, p.Item2.Value)).ToList();
            }

            var count = 0;
            foreach (var (dir, obj) in selection2)
            {
                var pathVideo = obj["meta"]?.Value<string>("path_video");
                if (pathVideo == null) { continue; }
                if (pathVideo.ToLower().EndsWith(".webm")) continue;
                if (pathVideo.ToLower().EndsWith(".mp4"))  continue;
                
                var pathCache = VideoController.GetStreamCachePath(pathVideo);

                if (File.Exists(pathCache)) continue;
                
                count++;
                JobRegistry.ConvertJobs.StartOrQueue((man) => new ConvertJob(man, pathVideo, pathCache, obj["meta"].Value<int>("datadirindex"), obj["meta"].Value<string>("uid")), false);
            }
            
            await context.Response.WriteAsync($"Started/Attached {count} new jobs");
        }

        public static async Task ManuallyForceCollectData(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "text/plain");
            
            var idx = (string)context.Request.RouteValues["idx"];

            if (idx.ToLower() == "all" || idx.ToLower() == "*")
            {
                for (var i = 0; i < Program.Args.DataDirs.Count; i++)
                {
                    var ddidx = i;
                    JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, ddidx, true), false);
                    await context.Response.WriteAsync($"Started/Attached {Program.Args.DataDirs.Count} new jobs");
                }
            }
            else
            {
                JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, int.Parse(idx), true), false);
                await context.Response.WriteAsync($"Started/Attached 1 new jobs");
            }
        }

        public static async Task AbortJob(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "text/plain");
            
            var jobid = (string)context.Request.RouteValues["jobid"];

            if (jobid == "all" || jobid == "*")
            {
                var count = 0;
                foreach (var man in JobRegistry.Managers) count += man.AbortAllJobs();
                await context.Response.WriteAsync($"OK, {count} jobs aborted");
            }
            else
            {
                foreach (var man in JobRegistry.Managers)
                {
                    if (man.AbortJob(jobid))
                    {
                        await context.Response.WriteAsync($"Job aborted");
                        return;
                    }
                }
            
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync($"Job not found");
            }
        }

        public static async Task ClearFinishedJobs(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "text/plain");
            
            foreach (var man in JobRegistry.Managers)
            {
                man.ClearFinishedJobs();
            }
            
            await context.Response.WriteAsync("OK");
        }
    }
}