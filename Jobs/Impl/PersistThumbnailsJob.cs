using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using ImageMagick;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Model;

namespace youtube_dl_viewer.Jobs
{
    public class PersistThumbnailsJob : Job
    {
        private (int, int) _progress = (0, 0);
        public override (int, int) Progress => _progress;

        public PersistThumbnailsJob(AbsJobManager man) : base(man, "persist-thumbnails")
        {
        }

        public override string Name => "PersistMissingThumbnails";

        protected override void Run()
        {
            try
            {
                var candidates = Program.GetAllCachedData()
                    .Where(v => v.PathThumbnail == null && v.PathVideo != null && v.IsCachedPreview && v.CachePreviewFile != null)
                    .ToList();

                _progress = (0, candidates.Count);

                for (var i = 0; i < candidates.Count; i++)
                {
                    if (AbortRequest) { ChangeState(JobState.Aborted); return; }

                    var vid = candidates[i];
                    var videoDir = Path.GetDirectoryName(vid.PathVideo);
                    var outputPath = Path.Combine(videoDir!, vid.FilenameBase + ".png");

                    if (File.Exists(outputPath))
                    {
                        _progress = (i + 1, candidates.Count);
                        continue;
                    }

                    try
                    {
                        var previewCache = vid.CachePreviewFile;
                        if (!File.Exists(previewCache))
                        {
                            _progress = (i + 1, candidates.Count);
                            continue;
                        }

                        byte[] jpegData;
                        using (var fs = new FileStream(previewCache, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                        {
                            using (var br = new BinaryReader(fs, Encoding.UTF8, true))
                            {
                                var prevCount = br.ReadByte();
                                if (prevCount < 2)
                                {
                                    // need at least frame index 1
                                    _progress = (i + 1, candidates.Count);
                                    continue;
                                }

                                // skip frame 0 header, read frame 1 header
                                br.ReadInt64(); // frame 0 offset
                                br.ReadInt32(); // frame 0 size

                                var dataOffset = br.ReadInt64();
                                var dataLength = br.ReadInt32();

                                fs.Seek(dataOffset, SeekOrigin.Begin);
                                jpegData = new byte[dataLength];
                                fs.Read(jpegData, 0, dataLength);
                            }
                        }

                        using (var image = new MagickImage(jpegData))
                        {
                            image.Write(outputPath, MagickFormat.Png);
                        }

                        Program.PatchDataCache(vid.DataDirIndex, vid.UID, new[] { "meta", "path_thumbnail" }, outputPath);
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"PersistThumbnails: Error processing '{vid.PathVideo}': {ex.Message}");
                    }

                    _progress = (i + 1, candidates.Count);
                }

                ChangeState(JobState.Finished);

                while (ProxyCount != 0)
                {
                    if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                    Thread.Sleep(100);
                }

                ChangeState(JobState.Success);
            }
            finally
            {
                if (State == JobState.Running) ChangeState(JobState.Failed);
            }
        }

        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("ProgressCurrent", _progress.Item1));
            obj.Add(new JProperty("ProgressTotal", _progress.Item2));
            return obj;
        }
    }
}
