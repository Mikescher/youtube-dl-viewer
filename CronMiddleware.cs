using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer
{
    public class CronMiddleware
    {
        private readonly RequestDelegate _next;

        public CronMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await Cron();
            }
            catch (Exception e)
            {
                await Console.Error.WriteLineAsync("Error in Cron Middleware:");
                Console.Error.Write(e);
            }
            
            await _next(context);
        }

        private async Task Cron()
        {
            if (Program.Args.AutoRefreshInterval <= 0) return;
            var interval = TimeSpan.FromSeconds(Program.Args.AutoRefreshInterval);
            
            for (var i = 0; i < Program.Args.DataDirs.Count; i++)
            {
                if (!Program.DataRefreshTimestamps.ContainsKey(i)) continue;
                if (Program.DataRefreshTimestamps[i] + interval > DateTime.Now) continue;
                
                var ddidx = i;
                
                await Console.Out.WriteLineAsync($"Start data refresh of [{ddidx}] by cron interval ({interval:g})");
                JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, ddidx), false);
            }
        }
    }
}