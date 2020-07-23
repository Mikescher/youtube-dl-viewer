using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Jobs
{
    public class ConvertJob : Job
    {
        public readonly string Destination;
        public readonly string Temp;
        
        private (int, int) _progress = (0, 1);
        public override (int, int) Progress => _progress;

        public ConvertJob(AbsJobManager man, string src, string dst) : base(man, src)
        {
            Destination = dst;
            Temp = Path.Combine(Path.GetTempPath(), "yt_dl_v_" + Guid.NewGuid().ToString("B") + ".webm");
        }
        
        public override string Name => $"Convert::'{Path.GetFileName(Source)}'";

        protected override void Run()
        {
            Process proc = null;

            var start = DateTime.Now;
            
            try
            {
                if (!Program.HasValidFFMPEG) throw new Exception("no ffmpeg");
                
                var (ecode1, outputProbe) = FFMPEGUtil.RunCommand(Program.Args.FFPROBEExec, $" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{Source}\"", "prevgen-probe");
                          
                if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                if (ecode1 != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffprobe)");
                    ChangeState(JobState.Failed);
                    return;
                }

                var videolen = double.Parse(outputProbe.Trim(), CultureInfo.InvariantCulture);

                var cmd = $" -i \"{Source}\" -f webm -vcodec libvpx-vp9 {Program.Args.ConvertFFMPEGParams} {Temp}";

                proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = Program.Args.FFMPEGExec,
                        Arguments = cmd,
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

                    ParseFFMpegOutputLine(args, videolen);
                };
                proc.ErrorDataReceived += (sender, args) =>
                {
                    if (args.Data == null) return;
                    if (builderOut.Length == 0) builderOut.Append(args.Data);
                    else builderOut.Append("\n" + args.Data);

                    ParseFFMpegOutputLine(args, videolen);
                };

                proc.Start();
                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();

                while (!File.Exists(Temp))
                {
                    if (AbortRequest) return;
                    if (proc.HasExited && !File.Exists(Temp))
                    {
                        ChangeState(JobState.Failed);
                        return;
                    }
                    Thread.Sleep(0);
                }
            
                for (;;) // Wait for ffmpeg
                {
                    if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                    if (proc.HasExited) break;
                    
                    Thread.Sleep(100);
                }
                
                if (Program.Args.FFMPEGDebugDir != null)
                {
                    File.WriteAllText(Path.Combine(Program.Args.FFMPEGDebugDir, $"{start:yyyy-MM-dd_HH-mm-ss.fffffff}_[convert].log"), $"> {Program.Args.FFMPEGExec} {cmd}\nExitCode:{proc.ExitCode}\nStart:{start:yyyy-MM-dd HH:mm:ss}\nEnd:{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n\n{builderOut}");
                }
                
                if (proc.ExitCode != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code)");
                    ChangeState(JobState.Failed);
                }
                else
                {
                    ChangeState(JobState.Finished);
                    _progress = (1, 1);
                    
                    while (ProxyCount != 0) // Wait for proxies
                    {
                        if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                        
                        Thread.Sleep(100);
                    }
                    
                    lock (SuperLock)
                    {
                        if (Destination != null)
                        {
                            for (var i = 0; i < 15; i++) // 15 retries
                            {
                                if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                                    
                                try
                                {
                                    File.Move(Temp, Destination);
                                    if (File.Exists(Destination) && new FileInfo(Destination).Length == 0) File.Delete(Destination);
                                    break;
                                }
                                catch (IOException)
                                {
                                    Console.Error.WriteLine("Move of converted file to cache failed ... retry in 2 secs");
                                    Thread.Sleep(2 * 1000);
                                }
                            }
                        }
                    }
                    
                    ChangeState(JobState.Success);
                }
            }
            finally
            {
                if (State == JobState.Running) ChangeState(JobState.Failed); // just to be sure

                if (proc != null && !proc.HasExited)
                {
                    proc.Kill(true);
                    Thread.Sleep(500);
                }

                for (var i = 0;; i++)
                {
                    try
                    {
                        if (File.Exists(Temp)) File.Delete(Temp);
                        break;
                    }
                    catch (IOException)
                    {
                        Console.Error.WriteLine("Delete of converted file (temp dir) failed ... retry in 3 secs");
                        Thread.Sleep(3 * 1000);
                    }

                    if (i == 10) // 10 retries
                    {
                        Console.Error.WriteLine("Delete of converted file (temp dir) failed finally");
                        break;
                    }
                }
            }
        }

        private void ParseFFMpegOutputLine(DataReceivedEventArgs args, double videolen)
        {
            if (args.Data.StartsWith("frame="))
            {
                var match = Regex.Match(args.Data, @"time=(?<time>[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{2})");
                if (match.Success)
                {
                    var time = TimeSpan.Parse(match.Groups["time"].Value);

                    _progress = ((int) Math.Floor((time.TotalSeconds / videolen) * 1000), 1000);
                }
            }
        }

        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("Destination", Destination));
            obj.Add(new JProperty("Temp", Temp));
            return obj;
        }
    }
}