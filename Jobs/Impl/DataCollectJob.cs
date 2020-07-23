using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Jobs
{
    public class DataCollectJob : Job
    {
        public readonly int Index;
        
        public string Result = null;
        public (string json, Dictionary<string, JObject> obj)? FullResult = null;
        
        private (int, int) _progress = (0, 1);
        public override (int, int) Progress => _progress;

        public DataCollectJob(AbsJobManager man, int index) : base(man, "self::"+index)
        {
            Index = index;
        }

        public override string Name => $"DataCollect::{Index}::'{((Index>=0 && Index <= Program.Args.DataDirs.Count) ? Program.DataDirToString(Program.Args.DataDirs[Index]) : "ERR")}'";

        public override void Abort()
        {
            Console.Error.WriteLine($"Cannot abort Job [{Name}]");
        }

        protected override void Run()
        {
            lock (Program.DataCache)
            {
                Program.DataCache[Index] = (null, null);
            }
            
            var (jsonstr, jsonobj) = CreateData(Index);
            
            lock (Program.DataCache)
            {
                Program.DataCache[Index] = (jsonstr, jsonobj);
                Result = jsonstr;
                FullResult = (jsonstr, jsonobj);
            }
            
            _progress = (1, 1);

            ChangeState(JobState.Finished);
            
            while (ProxyCount != 0) // Wait for proxies
            {
                if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                        
                Thread.Sleep(100);
            }
            
            ChangeState(JobState.Success);

            Result     = null; // Memory cleanup
            FullResult = null;
        }
        
        public (string jsonstr, Dictionary<string, JObject> jsonobj) CreateData(int index)
        {
            var datafiles = Directory.EnumerateFiles(Program.Args.DataDirs[index]).OrderBy(p => p.ToLower()).ToList();
            var processedFiles = new List<string>();

            var filesSubs = datafiles.Where(p => p.EndsWith(".vtt")).ToList();
            var filesInfo = datafiles.Where(p => p.EndsWith(".info.json")).ToList();

            var resultVideos = new JArray();

            var idsAreUnique = true;
            var idlist = new HashSet<string>();

            var cacheFiles = (Program.Args.CacheDir == null)
                ? new HashSet<string>()
                : Directory.EnumerateFiles(Program.Args.CacheDir).Select(Path.GetFileName).ToHashSet();

            var filecount = filesInfo.Count;

            int progr = 0;
            foreach (var pathJson in filesInfo)
            {
                _progress = (progr, filecount+1);

                progr++;
                
                JObject jinfo;
                try
                {
                    jinfo = JObject.Parse(File.ReadAllText(pathJson));
                }
                catch (Exception e)
                {
                    throw new Exception($"Could not parse file: '{pathJson}'", e);
                }

                var id = jinfo.Value<string>("id");
                if (id == null || idlist.Contains(id)) idsAreUnique = false;
                idlist.Add(id);
                
                var dir = Path.GetDirectoryName(pathJson);
                if (dir == null) continue;

                var filenameJson = Path.GetFileName(pathJson);

                var filenameBase = filenameJson.Substring(0, filenameJson.Length - ".info.json".Length);

                var pathDesc = Path.Combine(dir, filenameBase + ".description");
                if (!datafiles.Contains(pathDesc)) pathDesc = null;

                var pathVideo = Program.ExtVideo.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => datafiles.Contains(p));
                if (pathVideo == null) continue;

                var pathThumb = Program.ExtThumbnail.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => datafiles.Contains(p));

                var pathSubs = filesSubs
                    .Where(p => dir == Path.GetDirectoryName(p))
                    .Where(p => Path.GetFileName(p).EndsWith(".vtt"))
                    .Where(p => Path.GetFileName(p).StartsWith(filenameBase + "."))
                    .ToList();
                
                processedFiles.Add(pathJson);
                if (pathDesc != null) processedFiles.Add(pathDesc);
                if (pathThumb != null) processedFiles.Add(pathThumb);
                processedFiles.Add(pathVideo);
                processedFiles.AddRange(pathSubs);
                
                resultVideos.Add(new JObject
                (
                    new JProperty("meta", new JObject
                    (
                        new JProperty("uid", id),
                        
                        new JProperty("directory", dir),
                        
                        new JProperty("filename_base", filenameBase),
                        
                        new JProperty("path_json", pathJson),
                        new JProperty("path_description", pathDesc),
                        new JProperty("path_video", pathVideo),
                        new JProperty("path_video_abs", Path.GetFullPath(pathVideo)),
                        new JProperty("path_thumbnail", pathThumb),
                        new JProperty("paths_subtitle", new JObject(pathSubs.Select(p => new JProperty(Path.GetFileNameWithoutExtension(p).Substring(filenameBase.Length+1), p)))),
                        
                        new JProperty("cache_file", VideoController.GetStreamCachePath(pathVideo)),
                        new JProperty("cached", cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo)))),
                        new JProperty("previewscache_file", ThumbnailController.GetPreviewCachePath(pathVideo)),
                        new JProperty("cached_previews", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo))))
                    )),
                    new JProperty("data", new JObject
                    (
                        new JProperty("info", jinfo),
                        new JProperty("description", (pathDesc != null) ? File.ReadAllText(pathDesc) : null)
                    ))
                ));
            }

            foreach (var pathVideo in datafiles.Except(processedFiles).Where(p => Program.ExtVideo.Any(q => string.Equals("." + q, Path.GetExtension(p), StringComparison.CurrentCultureIgnoreCase))))
            {
                var id = pathVideo.Sha256();
                if (id == null || idlist.Contains(id)) idsAreUnique = false;
                idlist.Add(id);
                
                var dir = Path.GetDirectoryName(pathVideo);
                if (dir == null) continue;

                var filenameVideo = Path.GetFileName(pathVideo);

                var filenameBase = Path.GetFileNameWithoutExtension(filenameVideo);

                var pathDesc = Path.Combine(dir, filenameBase + ".description");
                if (!datafiles.Contains(pathDesc)) pathDesc = null;

                var pathThumb = Program.ExtThumbnail.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => datafiles.Contains(p));

                var pathSubs = filesSubs
                    .Where(p => dir == Path.GetDirectoryName(p))
                    .Where(p => Path.GetFileName(p).EndsWith(".vtt"))
                    .Where(p => Path.GetFileName(p).StartsWith(filenameBase + "."))
                    .ToList();
                
                if (pathDesc != null) processedFiles.Add(pathDesc);
                if (pathThumb != null) processedFiles.Add(pathThumb);
                processedFiles.Add(pathVideo);
                processedFiles.AddRange(pathSubs);
                
                resultVideos.Add(new JObject
                (
                    new JProperty("meta", new JObject
                    (
                        new JProperty("uid", id),
                        
                        new JProperty("directory", dir),
                        
                        new JProperty("filename_base", filenameBase),
                        
                        new JProperty("path_json", (object)null),
                        new JProperty("path_description", pathDesc),
                        new JProperty("path_video", pathVideo),
                        new JProperty("path_video_abs", Path.GetFullPath(pathVideo)),
                        new JProperty("path_thumbnail", pathThumb),
                        new JProperty("paths_subtitle", new JObject(pathSubs.Select(p => new JProperty(Path.GetFileNameWithoutExtension(p).Substring(filenameBase.Length+1), p)))),
                        
                        new JProperty("cache_file", VideoController.GetStreamCachePath(pathVideo)),
                        new JProperty("cached", cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo)))),
                        new JProperty("previewscache_file", ThumbnailController.GetPreviewCachePath(pathVideo)),
                        new JProperty("cached_previews", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo))))
                    )),
                    new JProperty("data", new JObject
                    (
                        new JProperty("info", new JObject
                        (
                            new JProperty("title", Path.GetFileNameWithoutExtension(pathVideo))
                        )),
                        new JProperty("description", (pathDesc != null) ? File.ReadAllText(pathDesc) : null)
                    ))
                ));
            }

            if (!idsAreUnique)
            {
                var uid = 10000;
                foreach (var rv in resultVideos)
                {
                    rv["meta"]?["uid"]?.Replace(new JProperty("uid", uid.ToString()));
                    uid++;
                }
            }

            var result = new JObject
            (
                new JProperty("videos", resultVideos),
                new JProperty("missing", new JArray(datafiles.Except(processedFiles).ToArray<object>()))
            );

            var jsonstr = result.ToString(Formatting.Indented);
            var jsonobj = resultVideos.ToDictionary(rv => rv["meta"]?.Value<string>("uid"), rv => (JObject) rv);
            
            return (jsonstr, jsonobj);
        }

        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("Index", Index));
            return obj;
        }
    }
}