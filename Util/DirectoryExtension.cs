using System.Collections.Generic;
using System.IO;

namespace youtube_dl_viewer.Util
{
    public static class DirectoryExtension
    {
        public static IEnumerable<string> EnumerateDirectoryRecursive(string dir, int depth)
        {
            foreach (var f in Directory.EnumerateFiles(dir)) yield return f;

            if (depth > 0)
            {
                foreach (var d in Directory.EnumerateDirectories(dir))
                {
                    foreach (var f in EnumerateDirectoryRecursive(d, depth-1)) yield return f;
                }
            }
        }
    }
}