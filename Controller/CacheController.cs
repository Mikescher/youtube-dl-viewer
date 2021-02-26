using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Jobs;
using youtube_dl_viewer.Model;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class CacheController
    {
        public static async Task GetStatus(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");

            var files = (await ListCacheFiles()).ToList();
            
            var r = new JObject
            (
                new JProperty("meta", new JObject
                (
                    new JProperty("count_total",     files.Count),
                    new JProperty("count_preview",   files.Count(p => p["linktype"].Value<string>() == "preview")),
                    new JProperty("count_thumbnail", files.Count(p => p["linktype"].Value<string>() == "thumbnail")),
                    new JProperty("count_video",     files.Count(p => p["linktype"].Value<string>() == "video")),
                    new JProperty("count_null",      files.Count(p => p["linktype"].Value<string>() == null))
                )),
                new JProperty("files", new JArray(files.ToArray<object>()))
            );
            
            await context.Response.WriteAsync(r.ToString(Program.DEBUG ? Formatting.Indented : Formatting.None));
        }

        private static async Task<List<JObject>> ListCacheFiles()
        {
            var result = new List<JObject>();

            if (Program.Args.CacheDir == null) return result;

            var vidcache = new List<VideoData>();
            foreach (var dd in Program.Args.DataDirs) vidcache.AddRange((await Program.GetData(dd)).Videos.Values);

            var di = new DirectoryInfo(Program.Args.CacheDir);
            foreach (var file in di.GetFiles().OrderBy(p => p.Name.ToLower()))
            {
                var linkPreviewFile   = vidcache.FirstOrDefault(p => DirectoryExtension.PathEquals(file.FullName, p.CachePreviewFile));
                var linkThumbnailFile = vidcache.FirstOrDefault(p => DirectoryExtension.PathEquals(file.FullName, p.CacheThumbnailFile));
                var linkVideoFile     = vidcache.FirstOrDefault(p => DirectoryExtension.PathEquals(file.FullName, p.CacheVideoFile));

                string linkType = null;
                if (linkPreviewFile   != null) linkType = "preview";
                if (linkThumbnailFile != null) linkType = "thumbnail";
                if (linkVideoFile     != null) linkType = "video";

                var linkSource = linkVideoFile ?? linkThumbnailFile ?? linkPreviewFile;
                
                var o = new JObject
                (
                    new JProperty("path",           file.FullName),
                    new JProperty("filename",       file.Name),
                    new JProperty("directory",      file.DirectoryName),
                    new JProperty("readonly",       file.IsReadOnly),
                    new JProperty("cdate",          file.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")),
                    new JProperty("cdate_f",        file.CreationTimeUtc.ToFileTimeUtc()),
                    new JProperty("mdate",          file.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")),
                    new JProperty("mdate_f",        file.LastWriteTimeUtc.ToFileTimeUtc()),
                    new JProperty("adate",          file.LastAccessTime.ToString("yyyy-MM-dd HH:mm:ss")),
                    new JProperty("adate_f",        file.LastAccessTimeUtc.ToFileTimeUtc()),
                    new JProperty("extension",      file.Extension),
                    new JProperty("filesize_r",     file.Length),
                    new JProperty("filesize",       FilesizeUtil.BytesToString(file.Length)),
                    new JProperty("linktype",       linkType),
                    new JProperty("isused",         linkSource != null),
                    new JProperty("link_uid",       linkSource?.UID),
                    new JProperty("link_title",     linkSource?.Title),
                    new JProperty("link_pathvideo", linkSource?.PathVideo),
                    new JProperty("link_dirindex",  linkSource?.DataDirIndex),
                    new JProperty("link_dirtile",   linkSource?.DataDir.Name)
                );
                result.Add(o);
            }
            
            return result;
        }
    }
}