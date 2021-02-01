using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;

namespace youtube_dl_viewer.Model
{
    public class VideoData
    {
        public readonly DataDirSpec DataDir;
        public readonly JObject Data;

        public JObject JSONMeta => (JObject)Data["meta"];
        public JObject JSONData => (JObject)Data["data"];
        
        public string UID       => JSONMeta.Value<string>("uid");
        public int DataDirIndex => JSONMeta.Value<int>("datadirindex");
        
        public string PathVideo     => JSONMeta.Value<string>("path_video");
        public string PathThumbnail => JSONMeta.Value<string>("path_thumbnail");
        
        public bool IsCachedVideo     => JSONMeta.Value<bool>("cached");
        public string CacheVideoFile  => JSONMeta.Value<string>("cache_file");
        public long CacheVideoSize    => JSONMeta.Value<long>("cached_video_fsize");
        
        public bool IsCachedPreview     => JSONMeta.Value<bool>("cached_previews");
        public string CachePreviewFile  => JSONMeta.Value<string>("previewscache_file");
        public long CachePreviewSize    => JSONMeta.Value<long>("cached_preview_fsize");
        
        public string Title       => JSONData.Value<string>("title");
        public string Description => JSONData.Value<string>("description");
        public JObject Info       => JSONData.Value<JObject>("info");

        public VideoData(DataDirSpec dir, JObject data)
        {
            DataDir = dir;
            Data = data;
        }


        public void PatchData(IEnumerable<string> field, object value)
        {
            ((JValue)field.Aggregate((JToken)Data, (current, fe) => current[fe])).Value = value;
        }

        public bool ShouldCacheVideo()
        {
            if (!Program.HasValidFFMPEG) return false;
            if (Program.Args.CacheDir == null) return false;
            
            if ((DataDir.VideomodeOverride ?? Program.Args.OptVideoMode) != 3) return false;
            
            if (PathVideo == null) return false;
            //if (PathVideo.ToLower().EndsWith(".webm")) return false;
            //if (PathVideo.ToLower().EndsWith(".mp4"))  return false;

            return true;
        }
    }
}