using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Jobs
{
    public enum ThumbnailExtractionMode
    {
        Sequential    = 0, // Multiple calls to ffmpeg to extract single frames (only one call at a time)
        Parallel      = 1, // Multiple calls to ffmpeg to extract single frames (all calls parallel)
        SingleCommand = 2, // single call to ffmpeg with fps filter
    }

    public class PreviewGenJob : Job
    {
        public readonly string Destination;
        public readonly string TempDir;

        public bool GenFinished = false;

        private readonly int? _queryImageIndex;
        
        public byte[] ImageData  = null;
        public int?   ImageCount = null;
        
        public PreviewGenJob(AbsJobManager man, string src, string dst, int? imgIdx) : base(man, src)
        {
            Destination = dst;
            _queryImageIndex = imgIdx;
            TempDir = Path.Combine(Path.GetTempPath(), "yt_dl_p_" + Guid.NewGuid().ToString("B"));
            Directory.CreateDirectory(TempDir);
        }

        public override string Name => $"GenPreview::{Path.GetFileName(Source)}";

        public override void Abort()
        {
            Console.Error.WriteLine($"Cannot abort Job [{Name}]");
        }

        protected override void Run()
        {
            try
            {
                if (!Program.HasValidFFMPEG) throw new Exception("no ffmpeg");
                
                var (ecode1, outputProbe) = RunCommand("ffprobe", $" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{Source}\"");
                
                if (ecode1 != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffprobe)");
                    return;
                }

                var videolen = double.Parse(outputProbe.Trim(), CultureInfo.InvariantCulture);

                var framedistance = videolen / Program.MaxPreviewImageCount; // __ frames by default (and max)

                if (framedistance < 5) framedistance = 5; // at least 10 sec dist between frames

                if (framedistance > videolen / 8) framedistance = videolen / Program.MinPreviewImageCount; // at least __ frames
                
                var taskList = new List<Task<(int, string)>>();

                if (Program.ThumbnailExtraction == ThumbnailExtractionMode.Parallel)
                {
                    var currpos = 0.0;
                    for (var i = 1; currpos < videolen; i++)
                    {
                        taskList.Add(RunCommandAsync("ffmpeg", $" -ss {currpos.ToString(CultureInfo.InvariantCulture)} -i \"{Source}\" -vframes 1 -vf \"scale={Program.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, i+".jpg")}\""));

                        currpos += framedistance;
                        if (framedistance < 0.1) break;
                    }

                    Task.WaitAll(taskList.Cast<Task>().ToArray());

                    if (taskList.Any(t => t.Result.Item1 != 0))
                    {
                        Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                        return;
                    }
                }
                else if (Program.ThumbnailExtraction == ThumbnailExtractionMode.Sequential)
                {
                    var currpos = 0.0;
                    for (var i = 1; currpos < videolen; i++)
                    {
                        var (ecode2, _) = RunCommand("ffmpeg", $" -ss {currpos.ToString(CultureInfo.InvariantCulture)} -i \"{Source}\" -vframes 1 -vf \"scale={Program.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, i+".jpg")}\"");

                        if (ecode2 != 0)
                        {
                            Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                            return;
                        }
                        currpos += framedistance;
                        if (framedistance < 0.1) break;
                    }
                }
                else if (Program.ThumbnailExtraction == ThumbnailExtractionMode.SingleCommand)
                {
                    var (ecode2, _) = RunCommand("ffmpeg", $" -i \"{Source}\" -vf \"fps=1/{Math.Ceiling(framedistance)}, scale={Program.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, "%1d.jpg")}\"");

                    if (ecode2 != 0)
                    {
                        Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                        return;
                    }
                }
                
                int prevCount;
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

                ImageCount = prevCount;
                
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

                for (var i = 0; i < prevCount; i++)
                {
                    var pos = ms.Position;
                    var bin = File.ReadAllBytes(Path.Combine(TempDir, (i+1) + ".jpg"));

                    if (_queryImageIndex == i) ImageData = bin;
                    
                    ms.Seek(1 + i * (8 + 4), SeekOrigin.Begin);
                    using (var bw = new BinaryWriter(ms, Encoding.UTF8, true))
                    {
                        bw.Write(pos);
                        bw.Write(bin.Length);
                    }
                    ms.Seek(0, SeekOrigin.End);

                    ms.Write(bin);
                }
                
                using (var fs = new FileStream(Destination, FileMode.Create, FileAccess.Write)) 
                {
                    ms.Seek(0, SeekOrigin.Begin);
                    ms.CopyTo(fs);
                }

                GenFinished = true;

                for(;;) // Wait for disengaged proxies
                {
                    lock (SuperLock)
                    {
                        if (Proxies.Count != 0) break;
                    }
                    Thread.Sleep(100);
                }
                
                
            }
            finally
            {
                this.GenFinished = true;

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

        private (int, string) RunCommand(string cmd, string args)
        {
            var proc1 = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = cmd,
                    Arguments = args,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };

            var builderOut = new StringBuilder();
            proc1.OutputDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
            proc1.ErrorDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
                
            proc1.Start();
            proc1.BeginOutputReadLine();
            proc1.BeginErrorReadLine();
            proc1.WaitForExit();

            return (proc1.ExitCode, builderOut.ToString());
        }
        
        private async Task<(int, string)> RunCommandAsync(string cmd, string args)
        {
            var proc1 = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = cmd,
                    Arguments = args,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };

            var builderOut = new StringBuilder();
            proc1.OutputDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
            proc1.ErrorDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
                
            proc1.Start();
            proc1.BeginOutputReadLine();
            proc1.BeginErrorReadLine();
            await proc1.WaitForExitAsync();

            return (proc1.ExitCode, builderOut.ToString());
        }
    }
}