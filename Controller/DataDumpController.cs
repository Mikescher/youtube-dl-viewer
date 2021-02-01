using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Model;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class DataDumpController
    {
        public static async Task ListData(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");

            var vidcache = Program.GetAllCachedData();
            
            var r = new JObject
            (
                new JProperty("columns", new JArray
                (
                    "Directory", 
                    "UID", 
                    "Filename", 
                    "Title", 
                    "should transcode video", 
                    "cached (transcode)", 
                    "cached (preview)", 
                    "ext_order", 
                    "path video", 
                    "path json", 
                    "path thumbnail", 
                    "path description", 
                    "path subtitles", 
                    "path transcode", 
                    "path preview", 
                    "filesize video", 
                    "filesize transcode", 
                    "filesize thumbnail", 
                    "upload_date", 
                    "duration", 
                    "webpage_url", 
                    "extractor"
                )),
                
                new JProperty("data", new JArray(vidcache.Select(GetColumns)).ToArray<object>())
            );
            
            await context.Response.WriteAsync(r.ToString(Program.DEBUG ? Formatting.Indented : Formatting.None));
        }

        private static JArray GetColumns(VideoData vd)
        {
            return new JArray
            (
                vd.DataDir.Name, 
                vd.UID,
                vd.FilenameBase,
                vd.Title,
                vd.ShouldTranscodeAndCacheVideo().ToString(),
                vd.IsCachedVideo.ToString(),
                vd.IsCachedPreview.ToString(),
                vd.ExternalOrderIndex?.ToString() ?? "(null)", 
                vd.PathVideo,
                vd.PathJSON ?? "(null)",
                vd.PathThumbnail,
                vd.PathDescription ?? "(null)",
                string.Join("\n", vd.PathSubtitles),
                vd.CacheVideoFile ?? "(null)",
                vd.CachePreviewFile ?? "(null)",
                FilesizeUtil.BytesToString(vd.Filesize),
                (vd.CacheVideoSize == 0)   ? "" : FilesizeUtil.BytesToString(vd.CacheVideoSize), 
                (vd.CachePreviewSize == 0) ? "" : FilesizeUtil.BytesToString(vd.CachePreviewSize), 
                vd.UploadDate ?? "(null)", 
                vd.Duration?.ToString() ?? "(null)", 
                vd.WebpageURL ?? "(null)", 
                vd.Extractor ?? "(null)"
            );
        }
    }
}