using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;

namespace youtube_dl_viewer.Model
{
    public class DataDirData
    {
        public readonly DataDirSpec DataDir;
        
        // UID => Video
        public readonly IReadOnlyDictionary<string, VideoData> Videos;
        
        // Metadata
        //   - "htmltitle"
        //   - "has_ext_order"
        //   - "count_total"
        //   - "count_info"
        //   - "count_raw"
        //   - "display_override"
        //   - "width_override"
        //   - "thumbnail_override"
        //   - "order_override"
        //   - "videomode_override"
        //   - "theme_override"
        public readonly JObject Meta;
        
        // Missing paths
        public readonly IReadOnlyList<string> Missing;
        
        public string JsonString;

        public DataDirData(DataDirSpec dir, JObject meta, IReadOnlyList<string> missing, IReadOnlyDictionary<string, VideoData> videos)
        {
            DataDir = dir;
            Meta    = meta;
            Missing = missing;
            Videos  = videos;

            RecreateJSON();
        }

        public void RecreateJSON()
        {
            var json = new JObject
            (
                new JProperty("meta", Meta),
                new JProperty("videos", new JArray(Videos.Select(p => p.Value.Data).ToArray<object>())),
                new JProperty("missing", new JArray(Missing.ToArray<object>()))
            );

            JsonString = json.ToString(Program.DEBUG ? Formatting.Indented : Formatting.None);
        }
    }
}