using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading;

namespace youtube_dl_viewer.Jobs
{
    public class PreviewGenJob : Job
    {
        public readonly string Source;
        public readonly string Destination;
        public readonly string TempDir;

        public bool GenFinished = false;

        public List<byte[]> ImageData;
        
        public PreviewGenJob(string src, string dst)
        {
            Source = src;
            Destination = dst;
            TempDir = Path.Combine(Path.GetTempPath(), "yt_dl_p_" + Guid.NewGuid().ToString("B"));
            Directory.CreateDirectory(TempDir);
        }

        protected override object SuperLock => JobRegistry.LockPreviewGen;

        public override string Name => $"GenPreview::{Path.GetFileName(Source)}";

        public override void Abort()
        {
            Console.Error.WriteLine($"Cannot abort Job [{Name}]");
        }

        protected override void Run()
        {
            try
            {
                var proc1 = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "ffprobe",
                        Arguments = $" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{Source}\"",
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                    }
                };

                var builderOut = new StringBuilder();
                proc1.OutputDataReceived += (sender, args) =>
                {
                    if (args.Data == null) return;
                    if (builderOut.Length == 0) builderOut.Append(args.Data);
                    else builderOut.Append("\n" + args.Data);
                };
                proc1.ErrorDataReceived += (sender, args) =>
                {
                    if (args.Data == null) return;
                    if (builderOut.Length == 0) builderOut.Append(args.Data);
                    else builderOut.Append("\n" + args.Data);
                };
                
                proc1.Start();
                proc1.BeginOutputReadLine();
                proc1.BeginErrorReadLine();
                proc1.WaitForExit();

                if (proc1.ExitCode != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffprobe)");
                    return;
                }

                var videolen = double.Parse(builderOut.ToString().Trim(), CultureInfo.InvariantCulture);

                var framedistance = videolen / 16; // 16 frames by default (and max)

                if (framedistance < 10) framedistance = 10; // at least 10 sec dist between frames

                if (framedistance > videolen / 4) framedistance = videolen / 4; // at least 4 frames
                
                var proc2 = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "ffmpeg",
                        Arguments = $" -i \"{Source}\" -vf \"fps=1/{Math.Ceiling(framedistance)}, scale={Program.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, "%1d.jpg")}\"",
                        CreateNoWindow = true,
                    }
                };
                
                proc2.Start();
                proc2.WaitForExit();

                if (proc2.ExitCode != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                    return;
                }

                var prevCount = 0;
                for (var i = 1;; i++)
                {
                    if (File.Exists(Path.Combine(TempDir, i+".jpg"))) continue;
                    prevCount = i - 1;
                    break;
                }

                if (prevCount == 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (no images created)");
                    return;
                }

                using var ms = new MemoryStream();
                
                using (var bw = new BinaryWriter(ms, Encoding.UTF8, true))
                {
                    bw.Write((byte) prevCount);

                    for (var i = 0; i < prevCount; i++)
                    {
                        bw.Write(0L);
                        bw.Write(0);
                    }
                }

                var imagdat = new List<byte[]>();
                
                for (var i = 0; i < prevCount; i++)
                {
                    var pos = ms.Position;
                    var bin = File.ReadAllBytes(Path.Combine(TempDir, (i+1) + ".jpg"));
                    
                    ms.Seek(1 + i * (8 + 4), SeekOrigin.Begin);
                    using (var bw = new BinaryWriter(ms, Encoding.UTF8, true))
                    {
                        bw.Write(pos);
                        bw.Write(bin.Length);
                    }
                    ms.Seek(0, SeekOrigin.End);

                    imagdat.Add(bin);
                    ms.Write(bin);
                }
                
                using (var fs = new FileStream(Destination, FileMode.Create, FileAccess.Write)) 
                {
                    ms.Seek(0, SeekOrigin.Begin);
                    ms.CopyTo(fs);
                }

                ImageData = imagdat;
                GenFinished = true;
            }
            finally
            {
                lock (JobRegistry.LockPreviewGen)
                {
                    JobRegistry.UnregisterGenPreviewJob(this);
                    this.Running = false;
                    this.GenFinished = true;
                }

                for (var i = 0;; i++)
                {
                    try
                    {
                        if (Directory.Exists(TempDir)) Directory.Delete(TempDir, true);
                        break;
                    }
                    catch (IOException)
                    {
                        Console.Error.WriteLine("Delete of generated preview files (temp dir) failed ... retry in 3 secs");
                        Thread.Sleep(3 * 1000);
                    }

                    if (i == 10) // 10 retries
                    {
                        Console.Error.WriteLine("Delete of generated preview files (temp dir) failed finally");
                        break;
                    }
                }
            }
        }
    }
}