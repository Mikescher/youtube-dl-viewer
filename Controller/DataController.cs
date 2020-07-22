using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class DataController
    {
        public static async Task GetData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(Program.Data[idx].json);
        }

        public static async Task RefreshData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            var json = CreateData(idx);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(json);
        }
        
        public static string CreateData(int index)
        {
            var datafiles = Directory.EnumerateFiles(Program.DataDirs[index]).OrderBy(p => p.ToLower()).ToList();
            var processedFiles = new List<string>();

            var filesSubs = datafiles.Where(p => p.EndsWith(".vtt")).ToList();
            var filesInfo = datafiles.Where(p => p.EndsWith(".info.json")).ToList();

            var resultVideos = new JArray();

            var idsAreUnique = true;
            var idlist = new HashSet<string>();

            var cacheFiles = (Program.CacheDir == null)
                ? new HashSet<string>()
                : Directory.EnumerateFiles(Program.CacheDir).Select(Path.GetFileName).ToHashSet();
            
            foreach (var pathJson in filesInfo)
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
            
            Program.Data[index] = (jsonstr, jsonobj);

            return jsonstr;
        }
    }
}