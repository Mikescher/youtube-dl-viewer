using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Jobs;
using youtube_dl_viewer.Model;

namespace youtube_dl_viewer
{
    public static class Program
    {
#if DEBUG
        public static bool DEBUG = true;
#else
        public static bool DEBUG = false;
#endif
        
        public static readonly string[] ExtVideo     = { "mkv", "mp4", "webm", "avi", "flv", "wmv", "mpg", "mpeg" };
        public static readonly string[] ExtThumbnail = { "jpg", "jpeg", "webp", "png" };

        private static string _currentDir = null;
        public static string CurrentDir => _currentDir ??= Environment.CurrentDirectory;

        public static readonly Dictionary<int, DateTime> DataRefreshTimestamps = new Dictionary<int, DateTime>();

        public static Timer CronTimer;
        
        public static string Version => "0.29";

        public static readonly Dictionary<int, DataDirData> DataCache = new Dictionary<int, DataDirData>();

        public static bool Initialized = false;
        
        public static bool HasValidFFMPEG = false;
        
        public static Arguments Args = new Arguments(); 
        
        public static void Main(string[] args)
        {
            Args.Parse(args);

            if (Args.OptHelp) { Args.PrintHelp(); return; }

            if (Args.OptVersion) { Console.Out.WriteLine(Version); return; }

            if (Args.ForceDebug) DEBUG = true;
            if (Args.NoDebug)    DEBUG = false;

            for (var i = 0; i < Args.DataDirs.Count; i++)
            {
                Console.Out.WriteLine($"> Start enumerating video data [{i}]: {Args.DataDirs[i].Path} (background)");
                var idx = i;
                lock (DataCache) { DataCache[idx] = null; }
                JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, idx, true), false);
                Console.Out.WriteLine();
            }

            if (Args.UseFFMPEG) // if disabled by cmd switch then we don't need to check
            {
                Console.Out.WriteLine($"> Verifying ffmpeg installation");
                VerifyFFMPEG();
                Console.Out.WriteLine();
            }
            
            Console.Out.WriteLine();
            Console.Out.WriteLine($"[#] Starting webserver on http://localhost:{Args.Port}/");
            Console.Out.WriteLine();

            if (Args.AutoOpenBrowser)
            {
                Console.Out.WriteLine("[#] Launching Webbrowser");

                Task.Run(async () =>
                {
                    await Task.Delay(1 * 1000); // Wait until local webserver ist started
                    
                    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                        Process.Start(new ProcessStartInfo($"http://localhost:{Args.Port}/") { UseShellExecute = true });
                    else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                        Process.Start("xdg-open", $"http://localhost:{Args.Port}/");
                    else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                        Process.Start("open", $"http://localhost:{Args.Port}/");
                });
                
                Console.Out.WriteLine();
            }

            Cron.Start();
            
            Initialized = true;
            CreateHostBuilder(args).Build().Run();
        }

        private static void VerifyFFMPEG()
        {
            try
            {
                {
                    var start = DateTime.Now;
                    
                    var proc = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = Args.FFMPEGExec,
                            Arguments = "-version",
                            CreateNoWindow = true,
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                        }
                    };

                    var builderOut = new StringBuilder();
                    proc.OutputDataReceived += (sender, args) =>
                    {
                        if (args.Data == null) return;
                        if (builderOut.Length == 0) builderOut.Append(args.Data);
                        else builderOut.Append("\n" + args.Data);
                    };
                    proc.ErrorDataReceived += (sender, args) =>
                    {
                        if (args.Data == null) return;
                        if (builderOut.Length == 0) builderOut.Append(args.Data);
                        else builderOut.Append("\n" + args.Data);
                    };

                    proc.Start();
                    proc.BeginOutputReadLine();
                    proc.BeginErrorReadLine();
                    proc.WaitForExit();
                
                    if (Args.FFMPEGDebugDir != null)
                    {
                        File.WriteAllText(Path.Combine(Args.FFMPEGDebugDir, $"{start:yyyy-MM-dd_HH-mm-ss.fffffff}_[ffmpeg-test].log"), $"> {Args.FFMPEGExec} -version\nExitCode:{proc.ExitCode}\nStart:{start:yyyy-MM-dd HH:mm:ss}\nEnd:{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n\n{builderOut}");
                    }
                
                    if (proc.ExitCode != 0) throw new Exception("Exitcode");
                }
                
                {
                    var start = DateTime.Now;

                    var proc = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = Args.FFPROBEExec,
                            Arguments = "-version",
                            CreateNoWindow = true,
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                        }
                    };

                    var builderOut = new StringBuilder();
                    proc.OutputDataReceived += (sender, args) =>
                    {
                        if (args.Data == null) return;
                        if (builderOut.Length == 0) builderOut.Append(args.Data);
                        else builderOut.Append("\n" + args.Data);
                    };
                    proc.ErrorDataReceived += (sender, args) =>
                    {
                        if (args.Data == null) return;
                        if (builderOut.Length == 0) builderOut.Append(args.Data);
                        else builderOut.Append("\n" + args.Data);
                    };

                    proc.Start();
                    proc.BeginOutputReadLine();
                    proc.BeginErrorReadLine();
                    proc.WaitForExit();
                
                    if (Args.FFMPEGDebugDir != null)
                    {
                        File.WriteAllText(Path.Combine(Args.FFMPEGDebugDir, $"{start:yyyy-MM-dd_HH-mm-ss.fffffff}_[ffprobe-test].log"), $"> {Args.FFMPEGExec} -version\nExitCode:{proc.ExitCode}\nStart:{start:yyyy-MM-dd HH:mm:ss}\nEnd:{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n\n{builderOut}");
                    }
                
                    if (proc.ExitCode != 0) throw new Exception("Exitcode");
                }

                
                Console.Out.WriteLine("  : ffmpeg+ffprobe installation seems to be ok");
                HasValidFFMPEG = true;
            }
            catch (Exception)
            {
                Console.Out.WriteLine("  : ffmpeg+ffprobe could not be found ... disabling live transcode and preview generators");
                HasValidFFMPEG = false;
            }
        }

        private static IHostBuilder CreateHostBuilder(string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.UseUrls($"http://localhost:{Args.Port}/");
                });
        }

        public static async Task<DataDirData> GetData(int idx)
        {
            DataDirData data;
            
            lock (DataCache) { data = DataCache[idx]; }
            
            if (data != null) return data;

            JobProxy<DataCollectJob> proxy;
            lock (JobRegistry.DataCollectJobs.LockObject)
            {
                lock (DataCache) { data = DataCache[idx]; }
                if (data != null) return data;
                
                proxy = JobRegistry.DataCollectJobs.GetProxyOrNullLockless((man) => new DataCollectJob(man, idx, true));;
                if (proxy == null) throw new Exception($"Data for index {idx} not found");
            }
            
            using (proxy)
            {
                while (proxy.JobRunningOrWaiting) await Task.Delay(50);

                if (proxy.Killed) throw new Exception("Job was killed prematurely");
                
                if (proxy.Job.FullResult == null) throw new Exception("Job returned no data");

                return proxy.Job.FullResult;
            }
        }

        public static List<VideoData> GetAllCachedData()
        {
            // returns video-json objects
            // aka
            // { meta: { ... }, data: { ... } }
            lock (DataCache)
            {
                return DataCache.Select(p => p.Value).Where(p => p != null).SelectMany(p => p.Videos.Values).ToList();
            }
        }

        public static bool PatchDataCache(int dataDirIndex, string videoUID, string[] field, object value)
        {
            lock (DataCache)
            {
                if (!DataCache.ContainsKey(dataDirIndex)) return false;
                if (DataCache[dataDirIndex] == null) return false;

                if (!DataCache[dataDirIndex].Videos.ContainsKey(videoUID)) return false;

                DataCache[dataDirIndex].Videos[videoUID].PatchData(field, value);
                DataCache[dataDirIndex].RecreateJSON();
                return true;
            }
        }
    }
}