using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;

namespace youtube_dl_viewer.Jobs
{
    public class ConvertJob : Job
    {
        public readonly string Destination;
        public readonly string Temp;

        public bool ConvertFinished = false;
        public bool Aborted = false;
        
        public ConvertJob(AbsJobManager man, string src, string dst) : base(man, src)
        {
            Destination = dst;
            Temp = Path.Combine(Path.GetTempPath(), "yt_dl_v_" + Guid.NewGuid().ToString("B") + ".webm");
        }

        public override string Name => $"Convert::{Path.GetFileName(Source)}";

        public override void Abort()
        {
            Console.Out.WriteLine($"Abort Job [{Name}] forcefully");
            
            Aborted = true;
            Unregister();
            Running = false;
            ConvertFinished = true;

            KillProxies();
        }

        protected override void Run()
        {
            Process proc = null;
            
            try
            {
                if (!Program.HasValidFFMPEG) throw new Exception("no ffmpeg");
                
                var cmd = $" -i \"{Source}\" -f webm -vcodec libvpx-vp9 {Program.ConvertFFMPEGParams} {Temp}";

                proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "ffmpeg",
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
                    if (Aborted) return;
                    if (proc.HasExited && !File.Exists(Temp))
                    {
                        this.ConvertFinished = true;
                        return;
                    }
                    Thread.Sleep(0);
                }
            
                for (;;)
                {
                    if (Aborted) return;
                    
                    if (proc.HasExited) ConvertFinished = true;
                    
                    if (proc.HasExited && Proxies.Count == 0)
                    {
                        if (proc.ExitCode != 0)
                        {
                            Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code)");
                            
                            this.ConvertFinished = true;
                            return;
                        }

                        lock (SuperLock)
                        {
                            if (Proxies.Count != 0) continue;

                            if (Destination != null)
                            {
                                for (var i = 0; i < 15; i++) // 15 retries
                                {
                                    if (Aborted) return;
                                    
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

                            this.ConvertFinished = true;
                            return;
                        }
                    }
                    
                    Thread.Sleep(100);
                }
            }
            finally
            {
                this.ConvertFinished = true;

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
    }
}