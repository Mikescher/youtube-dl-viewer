using System.IO;
using System.Linq;
using System.Reflection;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Config
{
    public class ThemeSpec
    {
        public readonly int Index;
        public readonly string Name;
        public readonly string Filename;
        public readonly string FullPath;

        public string URI => $"/themes/{Index}";

        private string _cache = null;
        
        public ThemeSpec(int idx, string name, string filename, string fullPath)
        {
            Index    = idx;
            Name     = name;
            Filename = filename;
            FullPath = fullPath;
        }

        public static ThemeSpec Parse(string value, int idx)
        {
            return new ThemeSpec(idx, Path.GetFileNameWithoutExtension(value), Path.GetFileName(value), value);
        }

        public string ReadCSS()
        {
            if (_cache != null) return _cache;

            // User Theme
            if (FullPath != null) return (_cache = File.ReadAllText(FullPath));
            
            // Default Theme

            var ass = Assembly.GetExecutingAssembly();
            foreach (var key in ass.GetManifestResourceNames().Where(p => p.StartsWith("youtube_dl_viewer.staticfiles.")))
            {
                var file = key.Substring("youtube_dl_viewer.staticfiles.".Length);
                if (file == Filename) return (_cache = ASPExtensions.GetTextResource(ass, key));
            }

            return null;
        }
    }
}