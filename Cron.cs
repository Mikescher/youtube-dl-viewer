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
                    
                    if (Program.Args.CronDoRefresh) await RefreshData(interval);

                    if (DateTime.Now - lastCron > interval)
                    {
                        lastCron = DateTime.Now;
                        
                        if (Program.Args.CronDoGenerateThumbnails) await GenerateThumbnails();
                        if (Program.Args.CronDoGeneratePreviews)   await GeneratePreviews();
                        if (Program.Args.CronDoConvertVideos)      await ConvertVideos();
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
            var videos = dirs.SelectMany(p => p.Videos.Values).ToList();
            
            foreach (var vid in videos)
            {
                var pathVideo = vid.PathVideo;
                if (pathVideo == null) { continue; }
                
                var pathCache = PreviewController.GetPreviewCachePath(pathVideo);

                if (File.Exists(pathCache)) continue;
                
                JobRegistry.PreviewGenJobs.StartOrQueue((man) => new PreviewGenJob(man, pathVideo, pathCache, null, vid.DataDirIndex, vid.UID), false);
            }
        }

        private static async Task GenerateThumbnails()
        {
            if (!Program.Args.CreateResizedThumbnails)  { Console.WriteLine("Could not [GenerateThumbnails] in cron - Resized thumbnails are disabled"); return; }
            if (Program.Args.CacheDir == null) { Console.WriteLine("Could not [GenerateThumbnails] in cron - No cache directory specified"); return; }

            var dirs = (await Task.WhenAll(Program.Args.DataDirs.Select(async (_, i) => await Program.GetData(i)))).ToList();
            var videos = dirs.SelectMany(p => p.Videos.Values).ToList();
            
            foreach (var vid in videos)
            {
                if (vid.PathVideo     == null) { continue; }
                if (vid.PathThumbnail == null) { continue; }
                
                var pathCache = ThumbnailController.GetThumbnailCachePath(vid.PathVideo);
                if (File.Exists(pathCache)) continue;
                
                JobRegistry.ThumbGenJobs.StartOrQueue((man) => new ThumbnailGenJob(man, vid, pathCache), false);
            }
        }

        private static async Task ConvertVideos()
        {
            if (!Program.HasValidFFMPEG)  { Console.WriteLine("Could not [GeneratePreviews] in cron - No ffmpeg installation found"); return; }
            if (Program.Args.CacheDir == null) { Console.WriteLine("Could not [GeneratePreviews] in cron - No cache directory specified"); return; }

            var dirs = (await Task.WhenAll(Program.Args.DataDirs.Select(async (s, i) => await Program.GetData(i)))).ToList();
            var videos = dirs.SelectMany(p => p.Videos.Values).ToList();
            
            foreach (var vid in videos)
            {
                if (!vid.ShouldTranscodeAndCacheVideo()) continue;
                
                var pathCache = VideoController.GetStreamCachePath(vid.PathVideo);
                if (File.Exists(pathCache)) continue;
                
                JobRegistry.ConvertJobs.StartOrQueue((man) => new ConvertJob(man, vid.PathVideo, pathCache, vid.DataDirIndex, vid.UID), false);
            }
        }
    }
}