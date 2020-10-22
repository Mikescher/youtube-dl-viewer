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

namespace youtube_dl_viewer
{
    public static class Program
    {
        public static readonly string[] ExtVideo     = { "mkv", "mp4", "webm", "avi", "flv", "wmv", "mpg", "mpeg" };
        public static readonly string[] ExtThumbnail = { "jpg", "jpeg", "webp", "png" };

        private static string _currentDir = null;
        public static string CurrentDir => _currentDir ??= Environment.CurrentDirectory;

        public static readonly Dictionary<int, DateTime> DataRefreshTimestamps = new Dictionary<int, DateTime>();

        public static Timer CronTimer;
        
        public static string Version => "0.26";

        // DataCache  :=   Dictionary<  DataDirIndex => (json, obj)  >
        // json       :=   full json for dir, aka:  { "videos": [ ... ], "missing": [ ... ] }
        // obj        :=   Dictionary<  VideoUID => video_json  >
        // video_json :=   json Object, aka:  { meta: { ... }, data: { ... } }
        public static readonly Dictionary<int, (string json, Dictionary<string, JObject> obj)> DataCache = new Dictionary<int, (string json, Dictionary<string, JObject> obj)>();

        public static bool Initialized = false;
        
        public static bool HasValidFFMPEG = false;
        
        public static Arguments Args = new Arguments(); 
        
        public static void Main(string[] args)
        {
            Args.Parse(args);

            if (Args.OptHelp) { Args.PrintHelp(); return; }

            if (Args.OptVersion) { Console.Out.WriteLine(Version); return; }

            for (var i = 0; i < Args.DataDirs.Count; i++)
            {
                Console.Out.WriteLine($"> Start enumerating video data [{i}]: {Args.DataDirs[i]} (background)");
                var idx = i;
                lock (DataCache) { DataCache[idx] = (null, null); }
                JobRegistry.DataCollectJobs.StartOrQueue((man) => new DataCollectJob(man, idx, true), false);
                Console.Out.WriteLine();
            }

            if (!Args.NoFFMPEG) // if disabled by cmd switch then we don't need to check
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

            if (Args.CronRefreshInterval > 0)
            {
                var ts_real = TimeSpan.FromSeconds(Args.CronRefreshInterval);
                var ts_timr = TimeSpan.FromSeconds(Args.CronRefreshInterval + 45);
                CronTimer = new Timer(async e =>
                {
                    await Console.Out.WriteLineAsync("Run autorefresh via cron timer");
                    await Console.Out.WriteLineAsync();
                    await CronMiddleware.RunCron(ts_real);
                }, null, ts_timr, ts_timr);
            }
            
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

        public static async Task<(string json, Dictionary<string, JObject> obj)> GetData(int idx)
        {
            (string json, Dictionary<string, JObject> obj) data;
            
            lock (DataCache) { data = DataCache[idx]; }
            
            if (data.json != null || data.obj != null) return data;

            JobProxy<DataCollectJob> proxy;
            lock (JobRegistry.DataCollectJobs.LockObject)
            {
                lock (DataCache) { data = DataCache[idx]; }
                if (data.json != null || data.obj != null) return data;
                
                proxy = JobRegistry.DataCollectJobs.GetProxyOrNullLockless((man) => new DataCollectJob(man, idx, true));;
                if (proxy == null) throw new Exception($"Data for index {idx} not found");
            }
            
            using (proxy)
            {
                while (proxy.JobRunningOrWaiting) await Task.Delay(50);

                if (proxy.Killed) throw new Exception("Job was killed prematurely");
                
                if (proxy.Job.FullResult == null) throw new Exception("Job returned no data");

                return proxy.Job.FullResult.Value;
            }
        }

        public static List<JObject> GetAllCachedData()
        {
            // returns video-json objects
            // aka
            // { meta: { ... }, data: { ... } }
            lock (DataCache)
            {
                return DataCache.Select(p => p.Value.obj).Where(p => p != null).SelectMany(p => p.Values).ToList();
            }
        }

        public static bool PatchDataCache(int dataDirIndex, string videoUID, string[] field, object value)
        {
            lock (DataCache)
            {
                if (!DataCache.ContainsKey(dataDirIndex)) return false;
                if (DataCache[dataDirIndex].json == null) return false;
                if (DataCache[dataDirIndex].obj == null)  return false;

                if (!DataCache[dataDirIndex].obj.ContainsKey(videoUID)) return false;
                
                ((JValue)field.Aggregate((JToken)DataCache[dataDirIndex].obj[videoUID], (current, fe) => current[fe])).Value = value;
                return true;
            }
        }
    }
}