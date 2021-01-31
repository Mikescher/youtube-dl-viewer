using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer
{
    public static class Cron
    {
        private static Thread _thread;
        public static void Start()
        {
            if (Program.Args.AutoRefreshInterval <= 0) return;
            
            _thread = new Thread(ThreadRun) { IsBackground = true };
            _thread.Start("CRON");
        }

        private static async void ThreadRun()
        {
            if (Program.Args.AutoRefreshInterval <= 0) return;
            
            var interval = TimeSpan.FromSeconds(Program.Args.CronRefreshInterval);

            var sleep = Math.Min(Program.Args.CronRefreshInterval / 10, 60 * 5); // seconds

            var lastCron = DateTime.MinValue;
            for (;;)
            {
                try
                {
                    await Task.Delay(sleep * 1000);

                    if (!Program.Initialized) continue;
                    
                    if (Program.Args.CronDoRefresh)          await RefreshData(interval);

                    if (DateTime.Now - lastCron > interval)
                    {
                        lastCron = DateTime.Now;
                        
                        if (Program.Args.CronDoGeneratePreviews) await GeneratePreviews();
                        if (Program.Args.CronDoConvertVideos)    await ConvertVideos();
                    }
                }
                catch (Exception e)
                {
                    await Console.Error.WriteLineAsync("Exception in CRON Thread:");
                    Console.Error.WriteLine(e);
                }
            }
        }
        
        private static async Task RefreshData(TimeSpan interval)
        {
            for (var i = 0; i < Program.Args.DataDirs.Count; i++)
            {
                if (!Program.DataRefreshTimestamps.ContainsKey(i)) continue;
                if (Program.DataRefreshTimestamps[i] + interval > DateTime.Now) continue;
                
                var ddidx = i;
                
                await Console.Out.WriteLineAsync($"Start data refresh of [{ddidx}] by cron interval ({interval:g})");
                JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, ddidx, false), false);
            }
        }

        private static async Task GeneratePreviews()
        {
            if (!Program.HasValidFFMPEG)  { Console.WriteLine("Could not [GeneratePreviews] in cron - No ffmpeg installation found"); return; }
            if (Program.Args.CacheDir == null) { Console.WriteLine("Could not [GeneratePreviews] in cron - No cache directory specified"); return; }

            var dirs = (await Task.WhenAll(Program.Args.DataDirs.Select(async (_, i) => await Program.GetData(i)))).ToList();
            var videos = dirs.Select(p => p.obj).SelectMany(p => p.Values).ToList();
            
            foreach (var obj in videos)
            {
                var pathVideo = obj["meta"]?.Value<string>("path_video");
                if (pathVideo == null) { continue; }
                
                var pathCache = ThumbnailController.GetPreviewCachePath(pathVideo);

                if (File.Exists(pathCache)) continue;
                
                JobRegistry.PreviewGenJobs.StartOrQueue((man) => new PreviewGenJob(man, pathVideo, pathCache, null, obj["meta"].Value<int>("datadirindex"), obj["meta"].Value<string>("uid")), false);
            }
        }

        private static async Task ConvertVideos()
        {
            if (!Program.HasValidFFMPEG)  { Console.WriteLine("Could not [GeneratePreviews] in cron - No ffmpeg installation found"); return; }
            if (Program.Args.CacheDir == null) { Console.WriteLine("Could not [GeneratePreviews] in cron - No cache directory specified"); return; }

            var dirs = (await Task.WhenAll(Program.Args.DataDirs.Select(async (s, i) => (s, await Program.GetData(i))))).ToList();
            var videos = dirs.SelectMany(p => p.Item2.obj.Values.Select(q => (p.Item1, q))).ToList();
            
            foreach (var (dir, obj) in videos)
            {
                if ((dir.VideomodeOverride ?? Program.Args.OptVideoMode) != 3) continue;
                
                var pathVideo = obj["meta"]?.Value<string>("path_video");
                if (pathVideo == null) continue;
                if (pathVideo.ToLower().EndsWith(".webm")) continue;
                if (pathVideo.ToLower().EndsWith(".mp4"))  continue;
                
                var pathCache = VideoController.GetStreamCachePath(pathVideo);

                if (File.Exists(pathCache)) continue;
                
                JobRegistry.ConvertJobs.StartOrQueue((man) => new ConvertJob(man, pathVideo, pathCache, obj["meta"].Value<int>("datadirindex"), obj["meta"].Value<string>("uid")), false);
            }
        }
    }
}