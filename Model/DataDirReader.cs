using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;
using Tommy;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Model
{
    public class DataDirReader
    {
        private readonly int _index;
        private readonly DataDirSpec _spec;

        private List<string> _datafiles;
        
        private List<string> _filesSubs;
        private List<string> _filesInfo;
        private List<string> _filesToml;
        
        private HashSet<string> _cacheFiles;
        private OrderingList _orderIndizes;
        
        public DataDirReader(int index, DataDirSpec spec)
        {
            _index = index;
            _spec  = spec;
        }

        public void Init()
        {
            _datafiles    = EnumerateMatchingFiles(_spec).OrderBy(p => p.ToLower()).ToList();
            _cacheFiles   = (Program.Args.CacheDir == null) ? new HashSet<string>() : Directory.EnumerateFiles(Program.Args.CacheDir).Select(Path.GetFileName).ToHashSet();
            _orderIndizes = _spec.GetOrdering();
            _filesSubs    = _datafiles.Where(p => p.EndsWith(".vtt")).ToList();
            _filesInfo    = _datafiles.Where(p => p.EndsWith(".info.json")).ToList();
            _filesToml    = _datafiles.Where(p => p.EndsWith(".info.tom")).ToList();
        }
        
        public DataDirData List(Action<int, int> progressCallback)
        {
            var resultVideos = new List<VideoData>();
            
            var filesVideo = _datafiles.Where(p => Program.ExtVideo.Any(q => Path.GetExtension(p).EqualsIgnoreCase("." + q))).ToList();
            var filecount = filesVideo.Count;
            
            int progr = 0;
            foreach (var pathVideo in filesVideo)
            {
                progressCallback?.Invoke(progr, filecount+1);
                progr++;
                
                var vidData = ReadFullVideoData(pathVideo);
                if (vidData == null) continue;
                
                resultVideos.Add(new VideoData(_spec, vidData));
            }

            var idDuplicates = resultVideos.GroupBy(p => p.UID).Where(p => p.Count() > 1).ToList();
            if (idDuplicates.Any())
            {
                Console.Error.WriteLine($"IDs are ot unique - generating custom IDs (duplicate id: {string.Join(", ", idDuplicates.Select(p => "'"+p.Key+"'"))})");
                
                var uid = 100000;
                foreach (var rv in resultVideos)
                {
                    var olduid = rv.UID.Replace(":", "");
                    rv.Data["meta"]?["uid"]?.Replace(new JValue(_index + "_" + olduid + uid));
                    uid++;
                }
            }

            var processedFiles = resultVideos.SelectMany(p => p.AllReferencedFiles).ToList();
            var duplicateProcessedFiles = processedFiles.GroupBy(p => p).Where(p => p.Count() > 1).ToList();
            var missingProcessedFiles = _datafiles.Except(processedFiles).ToList();

            if (duplicateProcessedFiles.Any())
            {
                Console.Error.WriteLine($"Some files are referenced by multiple videos, this is usually an error ({string.Join("; ", idDuplicates.Select(p => p.Key))})");
            }
            
            if (missingProcessedFiles.Any())
            {
                Console.Error.WriteLine($"There are some files in the directory '{_spec.Path}' that are not part of any video ({string.Join("; ", idDuplicates.Select(p => p.Key))})");
            }
            
            _orderIndizes?.UpdateFile();
            
            var meta = new JObject
            (
                new JProperty("htmltitle",     _spec.HTMLTitle ?? Program.Args.HTMLTitle),
                new JProperty("has_ext_order", _orderIndizes != null),
                new JProperty("count_total",   resultVideos.Count),
                new JProperty("count_info",    resultVideos.Count(p => p.PathJSON != null)),
                new JProperty("count_raw",     resultVideos.Count(p => p.PathJSON == null)),
                    
                new JProperty("display_override",   _spec.DisplayOverride),
                new JProperty("width_override",     _spec.WidthOverride),
                new JProperty("thumbnail_override", _spec.ThumbnailmodeOverride),
                new JProperty("order_override",     _spec.OrderOverride),
                new JProperty("videomode_override", _spec.VideomodeOverride),
                new JProperty("theme_override",     _spec.ThemeOverride)
            );
            
            return new DataDirData(_spec, meta, resultVideos.ToDictionary(p => p.UID, p => p));
        }

        private JObject ReadFullVideoData(string pathVideo)
        {
            var (jobj, dir, filenameBase) = ReadVideoDataRaw(pathVideo);
            if (jobj == null) return null;

            var pathJson = Path.Combine(dir, filenameBase + ".info.json");
            if (_datafiles.Contains(pathJson))
            {
                var jobj2 = ReadVideoDataInfoJson(pathJson);
                if (jobj2 != null) jobj = MergeJson(jobj, jobj2);
            }

            var pathToml = Path.Combine(dir, filenameBase + ".info.toml");
            if (_datafiles.Contains(pathToml))
            {
                var jobj2 = ReadVideoDataInfoToml(pathToml);
                if (jobj2 != null) jobj = MergeJson(jobj, jobj2);
            }

            var oid    = jobj["meta"]?.Value<string>("ext_order_id") ?? jobj["meta"]?.Value<string>("uid") ?? throw new Exception("Missing 'meta.uid' !?!");
            var extrac = jobj["data"]?["info"]?.Value<string>("extractor_key");
            var vtitle = jobj["data"]?.Value<string>("title");

            var ordering = _orderIndizes?.GetOrderingOrInsert(pathVideo, extrac, oid, vtitle);
            jobj["meta"]["ext_order_index"] = ordering;
            
            return jobj;
        }

        private (JObject, string, string) ReadVideoDataRaw(string pathVideo)
        {
            var uid = "SHA256" + pathVideo.Sha256().Substring(0, 18);
        
            var dir = Path.GetDirectoryName(pathVideo);
            if (dir == null) return (null, null, null);

            var filenameVideo = Path.GetFileName(pathVideo);

            var filenameBase = Path.GetFileNameWithoutExtension(filenameVideo);

            var pathDesc = Path.Combine(dir, filenameBase + ".description");
            if (!_datafiles.Contains(pathDesc)) pathDesc = null;

            var pathThumb = Program.ExtThumbnail.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => _datafiles.Contains(p));

            var pathSubs = _filesSubs
                .Where(p => dir == Path.GetDirectoryName(p))
                .Where(p => Path.GetFileName(p).EndsWith(".vtt"))
                .Where(p => Path.GetFileName(p).StartsWith(filenameBase + "."))
                .ToList();
            
            var vtitle = _spec.UseFilenameAsTitle ? Path.GetFileNameWithoutExtension(pathVideo) : Path.GetFileName(pathVideo);

            var vidData = new JObject
            (
                new JProperty("meta", new JObject
                (
                    new JProperty("uid", uid),
                    new JProperty("datadirindex", _index),
                    
                    new JProperty("directory", dir),
                    
                    new JProperty("filename_base", filenameBase),
                    
                    new JProperty("path_json", (object)null),
                    new JProperty("path_toml", (object)null),
                    new JProperty("path_description", pathDesc),
                    new JProperty("path_video", pathVideo),
                    new JProperty("path_video_abs", Path.GetFullPath(pathVideo)),
                    new JProperty("path_thumbnail", pathThumb),
                    new JProperty("paths_subtitle", new JObject(pathSubs.Select(p => new JProperty(Path.GetFileNameWithoutExtension(p).Substring(filenameBase.Length+1), p)))),
                    
                    new JProperty("cache_file", VideoController.GetStreamCachePath(pathVideo)),
                    new JProperty("cached", _cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo)))),
                    new JProperty("cached_video_fsize", _cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo))) ? new FileInfo(VideoController.GetStreamCachePath(pathVideo)).Length : 0),

                    new JProperty("previewscache_file", PreviewController.GetPreviewCachePath(pathVideo)),
                    new JProperty("cached_previews", _cacheFiles.Contains(Path.GetFileName(PreviewController.GetPreviewCachePath(pathVideo)))),
                    new JProperty("cached_preview_fsize", _cacheFiles.Contains(Path.GetFileName(PreviewController.GetPreviewCachePath(pathVideo))) ? new FileInfo(PreviewController.GetPreviewCachePath(pathVideo)).Length : 0),
                    
                    new JProperty("thumbnailcache_file", ThumbnailController.GetThumbnailCachePath(pathVideo)),
                    new JProperty("cached_thumbnail", _cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetThumbnailCachePath(pathVideo)))),
                    new JProperty("cached_thumbnail_fsize", _cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetThumbnailCachePath(pathVideo))) ? new FileInfo(ThumbnailController.GetThumbnailCachePath(pathVideo)).Length : 0),

                    new JProperty("filesize", new FileInfo(pathVideo).Length)
                )),
                new JProperty("data", new JObject
                (
                    new JProperty("title", vtitle),
                    new JProperty("description", (pathDesc != null) ? File.ReadAllText(pathDesc) : null),
                    new JProperty("info", new JObject())
                ))
            );

            return (vidData, dir, filenameBase);
        }

        private JObject ReadVideoDataInfoJson(string pathJson)
        {
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

            var dir = Path.GetDirectoryName(pathJson);
            if (dir == null) return null;

            var filenameJson = Path.GetFileName(pathJson);

            var filenameBase = filenameJson.Substring(0, filenameJson.Length - ".info.json".Length);

            var pathVideo = Program.ExtVideo.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => _datafiles.Contains(p));
            if (pathVideo == null) return null;

            var vtitle = _spec.UseFilenameAsTitle
                ? Path.GetFileNameWithoutExtension(pathVideo)
                : jinfo.Value<string>("fulltitle") ?? jinfo.Value<string>("title");

            if (Program.Args.TrimDataJSON) jinfo = TrimJSON(jinfo);

            var meta = new JProperty("meta", new JObject
            (
                new JProperty("uid", uid),
                new JProperty("path_json", pathJson)
            ));
            meta.Value["ext_order_id"] = id;

            var data = new JProperty("data", new JObject
            (
                new JProperty("title", vtitle),
                new JProperty("info", jinfo)
            ));
            if (vtitle != null) data.Value["title"] = vtitle;
            
            var vidData = new JObject ( meta, data );
            return vidData;
        }
        
        private JObject ReadVideoDataInfoToml(string pathToml)
        {
            TomlTable tinfo;
            try
            {
                tinfo = TOML.Parse(new StringReader(File.ReadAllText(pathToml)));
            }
            catch (Exception e)
            {
                throw new Exception($"Could not parse file: '{pathToml}'", e);
            }
            
            var uid           = tinfo.HasKey("id")            ? tinfo["id"].AsString.Value                   : null;
            var title         = tinfo.HasKey("title")         ? tinfo["title"].AsString.Value                : null;
            var extrac        = tinfo.HasKey("extractor_key") ? tinfo["extractor_key"].AsString.Value        : null;
            var upload_date   = tinfo.HasKey("upload_date")   ? tinfo["upload_date"].AsString.Value          : null;
            var like_count    = tinfo.HasKey("like_count")    ? (int?)tinfo["like_count"].AsInteger.Value    : null;
            var dislike_count = tinfo.HasKey("dislike_count") ? (int?)tinfo["dislike_count"].AsInteger.Value : null;
            var uploader      = tinfo.HasKey("uploader")      ? tinfo["uploader"].AsString.Value             : null;
            var duration      = tinfo.HasKey("duration")      ? tinfo["duration"].AsString.Value             : null;
            var webpage_url   = tinfo.HasKey("webpage_url")   ? tinfo["webpage_url"].AsString.Value          : null;
            var view_count    = tinfo.HasKey("view_count")    ? (int?)tinfo["view_count"].AsInteger.Value    : null;
            var width         = tinfo.HasKey("width")         ? (int?)tinfo["width"].AsInteger.Value         : null;
            var height        = tinfo.HasKey("height")        ? (int?)tinfo["height"].AsInteger.Value        : null;

            var dir = Path.GetDirectoryName(pathToml);
            if (dir == null) return null;

            var filenameToml = Path.GetFileName(pathToml);

            var filenameBase = filenameToml.Substring(0, filenameToml.Length - ".info.toml".Length);

            var pathVideo = Program.ExtVideo.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => _datafiles.Contains(p));
            if (pathVideo == null) return null;

            var meta = new JProperty("meta", new JObject
            (
                new JProperty("path_toml", pathToml)
            ));
            if (uid != null) meta.Value["uid"] = uid;
            if (uid != null) meta.Value["ext_order_id"] = uid;

            var data = new JProperty("data", new JObject
            (
                new JProperty("info", new JObject())
            ));
            if (title         != null) data.Value["title"]                 = title;
            if (extrac        != null) data.Value["info"]["extractor_key"] = extrac;
            if (upload_date   != null) data.Value["info"]["upload_date"]   = upload_date;
            if (like_count    != null) data.Value["info"]["like_count"]    = like_count;
            if (dislike_count != null) data.Value["info"]["dislike_count"] = dislike_count;
            if (uploader      != null) data.Value["info"]["uploader"]      = uploader;
            if (duration      != null) data.Value["info"]["duration"]      = duration;
            if (webpage_url   != null) data.Value["info"]["webpage_url"]   = webpage_url;
            if (view_count    != null) data.Value["info"]["view_count"]    = view_count;
            if (width         != null) data.Value["info"]["width"]         = width;
            if (height        != null) data.Value["info"]["height"]        = height;
            
            var vidData = new JObject ( meta, data );
            return vidData;
        }
        
        private List<string> EnumerateMatchingFiles(DataDirSpec dds)
        { 
            var mask = new Regex("^" + Regex.Escape(dds.FilenameFilter).Replace("\\*", ".*").Replace("\\?", ".") + "$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

            return DirectoryExtension
                .EnumerateDirectoryRecursive(dds.Path, dds.RecursionDepth)
                .Where(p => mask.IsMatch(Path.GetFileName(p)))
                .ToList();
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

        private JObject MergeJson(JObject source, JObject patch)
        {
            foreach (var prop in patch.Properties())
            {
                if (!source.ContainsKey(prop.Name))
                {
                    source.Add(prop.Name, prop.Value);
                }
                else
                {
                    if (prop.Value is JObject propObj)
                    {
                        source[prop.Name] = MergeJson((JObject) source[prop.Name], propObj);
                    }
                    else
                    {
                        source[prop.Name] = prop.Value;
                    }
                }
            }

            return source;
        }
    }
}