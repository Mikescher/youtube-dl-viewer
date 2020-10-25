using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Hosting.Internal;
using Microsoft.Net.Http.Headers;

namespace youtube_dl_viewer.Util
{
    public static class ASPExtensions
    {
#if DEBUG
        private static ConcurrentDictionary<(string,string), string> _reloadCacheText = new ConcurrentDictionary<(string,string), string>();
        private static ConcurrentDictionary<(string,string), byte[]> _reloadCacheBin  = new ConcurrentDictionary<(string,string), byte[]>();
#endif
        
        public static void MapEmbeddedResources(this IEndpointRouteBuilder endpoints, string baseWebPath, string baseResPath)
        {
            var ass = Assembly.GetExecutingAssembly();
            foreach (var key in ass.GetManifestResourceNames().Where(p => p.StartsWith(baseResPath + ".")))
            {
                var file = key.Substring(baseResPath.Length + 1);
                endpoints.MapGet(baseWebPath + file, async (ctxt) =>
                {
                    if (file.ToLower().EndsWith(".css"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "text/css");
                        await ctxt.Response.BodyWriter.WriteAsync(GetBinResource(ass, key, baseResPath, file));
                    }
                    else if (file.ToLower().EndsWith(".js"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "application/javascript");
                        await ctxt.Response.WriteAsync(GetTextResource(ass, key, baseResPath, file));
                    }
                    else if (file.ToLower().EndsWith(".svg"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
                        await ctxt.Response.WriteAsync(GetTextResource(ass, key, baseResPath, file));
                    }
                    else
                    {
                        await ctxt.Response.BodyWriter.WriteAsync(GetBinResource(ass, key, baseResPath, file));
                    }
                });
            }
        }

        public static void MapJSEmbeddedBundle(this IEndpointRouteBuilder endpoints, string path, string baseResPath, IEnumerable<string> reslist)
        {
            var ass = Assembly.GetExecutingAssembly();

            endpoints.MapGet(path, async (ctxt) =>
            {
                var js = reslist
                    .Select(p => (baseResPath + "." + p, p))
                    .Select(p => (p, GetTextResource(ass, p.Item1, baseResPath, p.Item2)))
                    .Select(p => $"/* -------- [{p.Item1}] ------ */\n\n" + p.Item2 + ";\n")
                    .Aggregate("", (a, b) => a + "\n\n" + b);
                ctxt.Response.Headers.Add(HeaderNames.ContentType, "application/javascript");
                await ctxt.Response.WriteAsync(js);
            });
        }
        
        public static byte[] GetBinResource(Assembly ass, string resourceName, string resourcePath, string resourceFilename)
        {
            using var stream = ass.GetManifestResourceStream(resourceName);
            if (stream == null) throw new ArgumentException();
            using var ms = new MemoryStream();
            
            stream.CopyTo(ms);
            var result = ms.ToArray();

#if DEBUG
            if (!_reloadCacheBin.ContainsKey((resourcePath, resourceFilename))) _reloadCacheBin[(resourcePath, resourceFilename)] = result;
            
            var resultReload = File.ReadAllBytes(GetFilesystemResourcePath(resourcePath, resourceFilename));
            if (resultReload == null) return result;
            if (_reloadCacheBin.TryGetValue((resourcePath, resourceFilename), out var cacheval) && resultReload.SequenceEqual(cacheval)) return result;
            
            Console.Out.WriteLine($"Reloaded [{resourcePath}|{resourceFilename}] from Filesystem");
            _reloadCacheBin[(resourcePath, resourceFilename)] = resultReload;
            return resultReload;
#endif

            return result;
        }
        
        public static string GetTextResource(Assembly ass, string resourceName, string resourcePath, string resourceFilename)
        {
            using var stream = ass.GetManifestResourceStream(resourceName);
            if (stream == null) throw new ArgumentException();
            using var reader = new StreamReader(stream);
            var result = reader.ReadToEnd();

#if DEBUG
            if (!_reloadCacheText.ContainsKey((resourcePath, resourceFilename))) _reloadCacheText[(resourcePath, resourceFilename)] = result;
            
            var resultReload = File.ReadAllText(GetFilesystemResourcePath(resourcePath, resourceFilename));
            if (resultReload == null) return result;
            if (_reloadCacheText.TryGetValue((resourcePath, resourceFilename), out var cacheval) && resultReload == cacheval) return result;
            
            Console.Out.WriteLine($"Reloaded [{resourcePath}|{resourceFilename}] from Filesystem");
            _reloadCacheText[(resourcePath, resourceFilename)] = resultReload;
            return resultReload;
#endif
            
            return result;
        }

        private static string GetFilesystemResourcePath(string resourcePath, string resourceFilename)
        {
            var rpath = resourcePath;
            if (rpath.StartsWith("youtube_dl_viewer.")) rpath = rpath.Substring("youtube_dl_viewer.".Length);

            // specify 'RESOURCE_RELOAD_URL' in launchSettings.json to enable live-reload
            var dir = Environment.GetEnvironmentVariable("RESOURCE_RELOAD_URL");
            if (dir == null) return null;
            
            return Path.Combine(dir, rpath.Replace('.', Path.DirectorySeparatorChar), resourceFilename);
        }
        
    }
}