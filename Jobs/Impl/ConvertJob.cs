using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer.Jobs
{
    public class ConvertJob : Job
    {
        public readonly string Destination;
        public readonly string Temp;

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
                
                var cmd = $" -i \"{Source}\" -f webm -vcodec libvpx-vp9 {Program.ConvertFFMPEGParams} {Temp}";

                proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = Program.FFMPEGExec,
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
                
                if (Program.FFMPEGDebugDir != null)
                {
                    File.WriteAllText(Path.Combine(Program.FFMPEGDebugDir, $"{start:yyyy-MM-dd_HH-mm-ss.fffffff}_[convert].log"), $"> {Program.FFMPEGExec} {cmd}\nExitCode:{proc.ExitCode}\nStart:{start:yyyy-MM-dd HH:mm:ss}\nEnd:{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n\n{builderOut}");
                }
                
                if (proc.ExitCode != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code)");
                    ChangeState(JobState.Failed);
                }
                else
                {
                    ChangeState(JobState.Finished);
                    
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

        public override JObject AsJson()
        {
            var obj = base.AsJson();
            obj.Add(new JProperty("Destination", Destination));
            obj.Add(new JProperty("Temp", Temp));
            return obj;
        }
    }
}