using System;
using System.IO;
using System.Text;
using System.Threading;
using ImageMagick;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Model;

namespace youtube_dl_viewer.Jobs
{
    public class ThumbnailGenJob : Job
    {
        public readonly string Destination;
        public readonly string TempDir;
        public readonly MagickFormat Format;
        
        public readonly VideoData Data;
        
        private (int, int) _progress = (0, 5);
        public override (int, int) Progress => _progress;
        
        public ThumbnailGenJob(AbsJobManager man, VideoData data, string dst) : base(man, data.PathThumbnail)
        {
            Destination      = dst;
            TempDir          = Path.Combine(Path.GetTempPath(), "yt_dl_t_" + Guid.NewGuid().ToString("B"));
            Format           = Program.Args.ThumbnailFormat;
            Data             = data;
            Directory.CreateDirectory(TempDir);
        }

        public override string Name => $"GenThumb::'{Path.GetFileName(Source)}'";

        protected override void Run()
        {
            try
            {
                if (Destination == null) throw new Exception("no destination");
                if (!File.Exists(Source)) throw new Exception("no source");

                using (var image = new MagickImage(Source))
                {
                    image.AutoOrient();
                    
                    var img_xs = image.Clone();
                    img_xs.Scale(70, 40);
                    
                    var img_s = image.Clone();
                    img_s.Scale(210, 118);
                    
                    var img_m = image.Clone();
                    img_m.Scale(320, 180);
                    
                    using (var ms = new MemoryStream())
                    {
                        int p1d, p2d, p3d, p4d; 
                        
                        using (var bw = new BinaryWriter(ms, Encoding.UTF8, true))
                        {
                            bw.Write((byte) 24);
                            bw.Write((byte) 34);
                            bw.Write((byte) 52);
                            bw.Write((byte) 1);

                            bw.Write(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

                            bw.Flush();
                            p1d = (int)ms.Position;
                            bw.Write(0);                // placeholder: offset
                            bw.Write(0);                // placeholder: size
                            bw.Write(ThumbnailController.MagickFormatToUint16(image.Format));
                            
                            bw.Flush();
                            p2d = (int)ms.Position;
                            bw.Write(0);                // placeholder: offset
                            bw.Write(0);                // placeholder: size
                            bw.Write(ThumbnailController.MagickFormatToUint16(image.Format));
                            
                            bw.Flush();
                            p3d = (int)ms.Position;
                            bw.Write(0);                // placeholder: offset
                            bw.Write(0);                // placeholder: size
                            bw.Write(ThumbnailController.MagickFormatToUint16(image.Format));
                            
                            bw.Flush();
                            p4d = (int)ms.Position;
                            bw.Write(0);                // placeholder: offset
                            bw.Write(0);                // placeholder: size
                            bw.Write(ThumbnailController.MagickFormatToUint16(image.Format));
                        }

                        _progress = (1, 6);

                        var p1 = (int)ms.Position;
                        img_xs.Write(ms, Format);
                        var s1 = (int) (ms.Position - p1);

                        _progress = (2, 6);

                        var p2 = (int)ms.Position;
                        img_s.Write(ms, Format);
                        var s2 = (int) (ms.Position - p2);

                        _progress = (3, 6);

                        var p3 = (int)ms.Position;
                        img_m.Write(ms, Format);
                        var s3 = (int) (ms.Position - p3);

                        _progress = (4, 6);

                        var p4 = (int)ms.Position;
                        using (var bw = new BinaryWriter(ms, Encoding.UTF8, true)) { bw.Write(File.ReadAllBytes(Source)); }
                        var s4 = (int) (ms.Position - p4);

                        ms.Seek(p1d, SeekOrigin.Begin);
                        using (var bw = new BinaryWriter(ms, Encoding.UTF8, true)) { bw.Write(p1); bw.Write(s1); }

                        ms.Seek(p2d, SeekOrigin.Begin);
                        using (var bw = new BinaryWriter(ms, Encoding.UTF8, true)) { bw.Write(p2); bw.Write(s2); }

                        ms.Seek(p3d, SeekOrigin.Begin);
                        using (var bw = new BinaryWriter(ms, Encoding.UTF8, true)) { bw.Write(p3); bw.Write(s3); }

                        ms.Seek(p4d, SeekOrigin.Begin);
                        using (var bw = new BinaryWriter(ms, Encoding.UTF8, true)) { bw.Write(p4); bw.Write(s4); }

                        _progress = (5, 6);
                        
                        using (var fs = new FileStream(Destination, FileMode.Create, FileAccess.Write)) 
                        {
                            ms.Seek(0, SeekOrigin.Begin);
                            ms.CopyTo(fs);
                        }
                    }
                    
                    Program.PatchDataCache(Data.DataDirIndex, Data.UID, new[]{"meta", "cached_thumbnail"}, true);
                    Program.PatchDataCache(Data.DataDirIndex, Data.UID, new[]{"meta", "cached_thumbnail_fsize"}, new FileInfo(Destination).Length);
                    Program.PatchDataCache(Data.DataDirIndex, Data.UID, new[]{"meta", "thumbnailcache_file"}, Destination);
                    
                    _progress = (6, 6);
                
                    ChangeState(JobState.Finished);
                    
                    while (ProxyCount != 0) // Wait for proxies
                    {
                        if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                        
                        Thread.Sleep(100);
                    }
                    
                    ChangeState(JobState.Success);
                }
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
            }
        }

        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("Destination", Destination));
            obj.Add(new JProperty("TempDir", TempDir));
            obj.Add(new JProperty("Format", Format));
            return obj;
        }
    }
}