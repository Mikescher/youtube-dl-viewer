using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Model;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Jobs
{
    public class DataCollectJob : Job
    {
        public readonly int Index;
        public readonly bool ClearOld;
        
        public string Result = null;
        public DataDirData FullResult = null;
        
        private (int, int) _progress = (0, 1);
        public override (int, int) Progress => _progress;

        public DataCollectJob(AbsJobManager man, int index, bool clearOld) : base(man, "self::"+index)
        {
            Index    = index;
            ClearOld = clearOld;
        }

        public override string Name => $"DataCollect::{Index}::'{((Index>=0 && Index <= Program.Args.DataDirs.Count) ? Program.Args.DataDirs[Index].Name : "ERR")}'";

        public override void Abort()
        {
            Console.Error.WriteLine($"Cannot abort Job [{Name}]");
        }

        protected override void Run()
        {
            if (ClearOld)
            {
                lock (Program.DataCache) Program.DataCache[Index] = null;
            }
            
            var dat = CreateData(Index);
            
            lock (Program.DataCache)
            {
                Program.DataRefreshTimestamps[Index] = DateTime.Now;
                Program.DataCache[Index] = dat;
                Result = dat.JsonString;
                FullResult = dat;
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
        
        public DataDirData CreateData(int index)
        {
            var ddir = Program.Args.DataDirs[index];
            
            var datafiles = EnumerateMatchingFiles(ddir).OrderBy(p => p.ToLower()).ToList();
            var processedFiles = new List<string>();

            var filesSubs = datafiles.Where(p => p.EndsWith(".vtt")).ToList();
            var filesInfo = datafiles.Where(p => p.EndsWith(".info.json")).ToList();

            var resultVideos = new List<VideoData>();

            var idsAreUnique = true;
            var idlist = new HashSet<string>();

            var cacheFiles = (Program.Args.CacheDir == null)
                ? new HashSet<string>()
                : Directory.EnumerateFiles(Program.Args.CacheDir).Select(Path.GetFileName).ToHashSet();

            var orderIndizes = ddir.GetOrdering();

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
                var extrac = jinfo.Value<string>("extractor_key");
                var uid = extrac + "::" + id;
                uid = uid.Replace("$", "$X0024");
                uid = uid.Replace("#", "$X0023");
                uid = uid.Replace("&", "$X0026");
                uid = uid.Replace("\r", "");
                uid = uid.Replace("\n", "");
                uid = uid.Replace("\t", "");
                if (uid == null || idlist.Contains(uid))
                {
                    idsAreUnique = false;
                    Console.Error.WriteLine($"IDs are ot unique (duplicate id: '{uid}') - generating custom IDs");
                }
                idlist.Add(uid);
                
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

                var vtitle = ddir.UseFilenameAsTitle 
                    ? Path.GetFileNameWithoutExtension(pathVideo)
                    : jinfo.Value<string>("fulltitle") ?? jinfo.Value<string>("title") ?? Path.GetFileName(pathVideo);

                var descr = (pathDesc != null) ? File.ReadAllText(pathDesc) : jinfo.Value<string>("description");

                var order_index = orderIndizes?.GetOrderingOrInsert(pathVideo, extrac, id, vtitle);
                
                if (Program.Args.TrimDataJSON) jinfo = TrimJSON(jinfo);
                
                var vid_data = new JObject
                (
                    new JProperty("meta", new JObject
                    (
                        new JProperty("uid", uid),
                        new JProperty("datadirindex", index),
                        
                        
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
                        new JProperty("cached_video_fsize", cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo))) ? new FileInfo(VideoController.GetStreamCachePath(pathVideo)).Length : 0),

                        
                        new JProperty("previewscache_file", ThumbnailController.GetPreviewCachePath(pathVideo)),
                        new JProperty("cached_previews", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo)))),
                        new JProperty("cached_preview_fsize", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo))) ? new FileInfo(ThumbnailController.GetPreviewCachePath(pathVideo)).Length : 0),
                        
                        new JProperty("filesize", new FileInfo(pathVideo).Length),

                        new JProperty("ext_order_index", order_index)
                    )),
                    new JProperty("data", new JObject
                    (
                        new JProperty("title", vtitle),
                        new JProperty("description", descr),
                        new JProperty("info", jinfo)
                    ))
                );
                
                resultVideos.Add(new VideoData(ddir, vid_data));
            }

            var filesVideo = datafiles.Except(processedFiles).Where(p => Program.ExtVideo.Any(q => string.Equals("." + q, Path.GetExtension(p), StringComparison.CurrentCultureIgnoreCase))).ToList();
            foreach (var pathVideo in filesVideo)
            {
                var uid = "SHA256"+pathVideo.Sha256().Substring(0, 18);
                if (uid == null || idlist.Contains(uid))
                {
                    idsAreUnique = false;
                    Console.Error.WriteLine($"IDs are ot unique (duplicate id: '{uid}') - generating custom IDs");
                }
                idlist.Add(uid);
                
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

                var vtitle = ddir.UseFilenameAsTitle ? Path.GetFileNameWithoutExtension(pathVideo) : Path.GetFileName(pathVideo);

                var order_index = orderIndizes?.GetOrderingOrInsert(pathVideo, null, null, vtitle);
                
                var vid_data = new JObject
                (
                    new JProperty("meta", new JObject
                    (
                        new JProperty("uid", uid),
                        
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
                        new JProperty("cached_video_fsize", cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo))) ? new FileInfo(VideoController.GetStreamCachePath(pathVideo)).Length : 0),

                        new JProperty("previewscache_file", ThumbnailController.GetPreviewCachePath(pathVideo)),
                        new JProperty("cached_previews", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo)))),
                        new JProperty("cached_preview_fsize", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo))) ? new FileInfo(ThumbnailController.GetPreviewCachePath(pathVideo)).Length : 0),
                        
                        new JProperty("filesize", new FileInfo(pathVideo).Length),

                        new JProperty("ext_order_index", order_index)
                    )),
                    new JProperty("data", new JObject
                    (
                        new JProperty("title", vtitle),
                        new JProperty("description", (pathDesc != null) ? File.ReadAllText(pathDesc) : null),
                        new JProperty("info", new JObject())
                    ))
                );

                resultVideos.Add(new VideoData(ddir, vid_data));
            }

            if (!idsAreUnique)
            {
                var uid = 100000;
                foreach (var rv in resultVideos)
                {
                    rv.Data["meta"]?["uid"]?.Replace(new JValue(index + "_" + uid));
                    uid++;
                }
            }

            orderIndizes?.UpdateFile();

            var meta = new JObject
            (
                new JProperty("htmltitle",     ddir.HTMLTitle ?? Program.Args.HTMLTitle),
                new JProperty("has_ext_order", orderIndizes != null),
                new JProperty("count_total",   filesInfo.Count + filesVideo.Count),
                new JProperty("count_info",    filesInfo.Count),
                new JProperty("count_raw",     filesVideo.Count),
                    
                new JProperty("display_override",   ddir.DisplayOverride),
                new JProperty("width_override",     ddir.WidthOverride),
                new JProperty("thumbnail_override", ddir.ThumbnailmodeOverride),
                new JProperty("order_override",     ddir.OrderOverride),
                new JProperty("videomode_override", ddir.VideomodeOverride),
                new JProperty("theme_override",     ddir.ThemeOverride)
            );
            
            return new DataDirData(ddir, meta, datafiles.Except(processedFiles).ToList(), resultVideos.ToDictionary(p => p.UID, p => p));
        }

        private JObject TrimJSON(JObject jinfo)
        {
            foreach (var key in jinfo.Properties().Select(p => p.Name).ToList())
            {
                if (key == "upload_date")   continue;
                if (key == "title")         continue;
                if (key == "categories")    continue;
                if (key == "like_count")    continue;
                if (key == "dislike_count") continue;
                if (key == "uploader")      continue;
                if (key == "channel_url")   continue;
                if (key == "uploader_url")  continue;
                if (key == "duration")      continue;
                if (key == "tags")          continue;
                if (key == "webpage_url")   continue;
                if (key == "view_count")    continue;
                if (key == "extractor_key") continue;
                if (key == "width")         continue;
                if (key == "height")        continue;
                
                jinfo.Remove(key);
            }
            return jinfo;
        }

        private List<string> EnumerateMatchingFiles(DataDirSpec dds)
        { 
            var mask = new Regex("^" + Regex.Escape(dds.FilenameFilter).Replace("\\*", ".*").Replace("\\?", ".") + "$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

            return DirectoryExtension
                .EnumerateDirectoryRecursive(dds.Path, dds.RecursionDepth)
                .Where(p => mask.IsMatch(Path.GetFileName(p)))
                .ToList();
        }
        
        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("Index", Index));
            return obj;
        }
    }
}