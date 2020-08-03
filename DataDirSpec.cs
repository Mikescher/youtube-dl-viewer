using System;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer
{
    public class DataDirSpec
    {
        public readonly string Path;
        public readonly string Name;
        public readonly bool UseFilenameAsTitle;
        public readonly int RecursionDepth;
        public readonly string FilenameFilter;

        public DataDirSpec(string path, string name, bool useFilenameAsTitle, int recursionDepth, string filenameFilter)
        {
            Path               = path;
            Name               = name;
            UseFilenameAsTitle = useFilenameAsTitle;
            RecursionDepth     = recursionDepth;
            FilenameFilter     = filenameFilter;
        }

        public static DataDirSpec Parse(string spec)
        {
            if (!spec.StartsWith("{")) return FromPath(spec);

            var json = JObject.Parse(spec);

            var path = json.Value<string>("path");
            if (path == null) throw new Exception("Cannot parse extended path-spec (missing 'path' attribute)");

            var name = json.Value<string>("name") ?? path;

            var useFilename = json.GetValue("use_filename_as_title")?.Value<bool>() ?? false;
            
            var recDepth = json.GetValue("recursion")?.Value<int>() ?? 0;
            
            var filter = json.Value<string>("filter") ?? "*";
            
            return new DataDirSpec(path, name, useFilename, recDepth, filter);
        }

        public static DataDirSpec FromPath(string dir)
        {
            return new DataDirSpec(dir, dir, false, 0, "*");
        }
    }
}