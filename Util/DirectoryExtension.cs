using System;
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

        public static bool PathEquals(string p1, string p2)
        {
            p1 = Path.GetFullPath(p1);
            p2 = Path.GetFullPath(p2);

            if (Environment.OSVersion.Platform == PlatformID.Win32NT)
            {
                p1 = p1.ToLower();
                p2 = p2.ToLower();
            }

            return p1 == p2;
        }
    }
}