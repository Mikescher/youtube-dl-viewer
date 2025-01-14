using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer
{
    public class AutoRefreshMiddleware
    {
        public static readonly ConcurrentDictionary<int, DateTime?> LastAutoRefreshData = new();
        
        private readonly RequestDelegate _next;

        public AutoRefreshMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await AutoRefresh();
            }
            catch (Exception e)
            {
                await Console.Error.WriteLineAsync("Error in Cron Middleware:");
                Console.Error.Write(e);
            }
            
            await _next(context);
        }

        private async Task AutoRefresh()
        {
            for (var i = 0; i < Program.Args.DataDirs.Count; i++) LastAutoRefreshData.TryAdd(i, null);
            
            if (Program.Args.AutoRefreshInterval <= 0) return;
            var interval = TimeSpan.FromSeconds(Program.Args.AutoRefreshInterval);

            await RunAutoRefresh(interval);
        }

        public static async Task RunAutoRefresh(TimeSpan interval)
        {
            for (var i = 0; i < Program.Args.DataDirs.Count; i++)
            {
                if (!Program.DataRefreshTimestamps.ContainsKey(i)) continue;
                if (Program.DataRefreshTimestamps[i] + interval > DateTime.Now) continue;
                
                var ddidx = i;
                
                LastAutoRefreshData[ddidx] = DateTime.Now;
                
                await Console.Out.WriteLineAsync($"Start data refresh of [{ddidx}] by cron interval ({interval:g})");
                JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, ddidx, false), false);
            }
        }
    }
}