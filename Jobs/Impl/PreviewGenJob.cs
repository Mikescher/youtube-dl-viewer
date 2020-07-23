using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
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

        private readonly int? _queryImageIndex;
        
        public byte[] ImageData  = null;
        public int?   ImageCount = null;

        private (int, int) _progress = (0, Program.Args.MaxPreviewImageCount+1);
        public override (int, int) Progress => _progress;
        
        public PreviewGenJob(AbsJobManager man, string src, string dst, int? imgIdx) : base(man, src)
        {
            Destination = dst;
            _queryImageIndex = imgIdx;
            TempDir = Path.Combine(Path.GetTempPath(), "yt_dl_p_" + Guid.NewGuid().ToString("B"));
            Directory.CreateDirectory(TempDir);
        }

        public override string Name => $"GenPreview::'{Path.GetFileName(Source)}'";

        protected override void Run()
        {
            try
            {
                if (!Program.HasValidFFMPEG) throw new Exception("no ffmpeg");
                
                var (ecode1, outputProbe) = FFMPEGUtil.RunCommand(Program.Args.FFPROBEExec, $" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{Source}\"", "prevgen-probe");
                
                _progress = (1, Program.Args.MaxPreviewImageCount+1);
                
                if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                if (ecode1 != 0)
                {
                    Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffprobe)");
                    ChangeState(JobState.Failed);
                    return;
                }

                var videolen = double.Parse(outputProbe.Trim(), CultureInfo.InvariantCulture);

                var framedistance = videolen / Program.Args.MaxPreviewImageCount; // __ frames by default (and max)

                if (framedistance < 5) framedistance = 5; // at least 10 sec dist between frames

                if (framedistance > videolen / 8) framedistance = videolen / Program.Args.MinPreviewImageCount; // at least __ frames
                
                var taskList = new List<Task<(int, string)>>();

                if (Program.Args.ThumbnailExtraction == ThumbnailExtractionMode.Parallel)
                {
                    var currpos = 0.0;
                    for (var i = 1; currpos < videolen; i++)
                    {
                        taskList.Add(FFMPEGUtil.RunCommandAsync(Program.Args.FFMPEGExec, $" -ss {currpos.ToString(CultureInfo.InvariantCulture)} -i \"{Source}\" -vframes 1 -vf \"scale={Program.Args.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, i+".jpg")}\"", $"prevgen-run-{i}"));

                        currpos += framedistance;
                        if (framedistance < 0.1) break;
                    }

                    Task.WaitAll(taskList.Cast<Task>().ToArray());

                    _progress = (2, 3);

                    if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                    if (taskList.Any(t => t.Result.Item1 != 0))
                    {
                        Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                        ChangeState(JobState.Failed);
                        return;
                    }
                }
                else if (Program.Args.ThumbnailExtraction == ThumbnailExtractionMode.Sequential)
                {
                    var currpos = 0.0;
                    for (var i = 1; currpos < videolen; i++)
                    {
                        var (ecode2, _) = FFMPEGUtil.RunCommand(Program.Args.FFMPEGExec, $" -ss {currpos.ToString(CultureInfo.InvariantCulture)} -i \"{Source}\" -vframes 1 -vf \"scale={Program.Args.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, i+".jpg")}\"", $"prevgen-run-{i}");
                        
                        _progress = (i+1, (int)Math.Floor(videolen / framedistance) + 2);
                        
                        if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                        if (ecode2 != 0)
                        {
                            Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                            ChangeState(JobState.Failed);
                            return;
                        }
                        currpos += framedistance;
                        if (framedistance < 0.1) break;
                    }
                }
                else if (Program.Args.ThumbnailExtraction == ThumbnailExtractionMode.SingleCommand)
                {
                    var (ecode2, _) = FFMPEGUtil.RunCommand(Program.Args.FFMPEGExec, $" -i \"{Source}\" -vf \"fps=1/{Math.Ceiling(framedistance)}, scale={Program.Args.PreviewImageWidth}:-1\" \"{Path.Combine(TempDir, "%1d.jpg")}\"", $"prevgen-run");

                    _progress = (2, 3);

                    if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                    if (ecode2 != 0)
                    {
                        Console.Error.WriteLine($"Job [{Name}] failed (non-zero exit code in ffmpeg)");
                        ChangeState(JobState.Failed);
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
                    ChangeState(JobState.Failed);
                    return;
                }

                ImageCount = prevCount;

                using (var ms = new MemoryStream())
                {
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

                        if (AbortRequest) { ChangeState(JobState.Aborted); return; }

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
                }
                
                _progress = (1, 1);
                
                ChangeState(JobState.Finished);
                
                if (_queryImageIndex != null)
                {
                    while (ProxyCount != 0) // Wait for proxies
                    {
                        if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                        
                        Thread.Sleep(100);
                    }
                }
                
                ChangeState(JobState.Success);

                
            }
            finally
            {
                if (State == JobState.Running) ChangeState(JobState.Failed); // just to be sure

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

                ImageData = null; // Memory cleanup
            }
        }

        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("Destination", Destination));
            obj.Add(new JProperty("TempDir", TempDir));
            obj.Add(new JProperty("QueryImageIndex", _queryImageIndex));
            obj.Add(new JProperty("ImageCount", _queryImageIndex));
            return obj;
        }
    }
}