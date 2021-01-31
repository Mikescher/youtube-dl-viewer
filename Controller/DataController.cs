using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer.Controller
{
    public static class DataController
    {
        public static async Task GetData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync((await Program.GetData(idx)).JsonString);
        }

        public static async Task RefreshData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            using (var proxy = JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, idx, true)))
            {
                while (proxy.JobRunningOrWaiting) await Task.Delay(50);

                if (proxy.Killed)              { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
                if (proxy.Job.Result == null)  { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job returned no data");       return; }

                context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
                await context.Response.WriteAsync(proxy.Job.Result);
            }
        }
    }
}