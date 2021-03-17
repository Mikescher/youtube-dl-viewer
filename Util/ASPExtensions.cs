using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Net.Http.Headers;

namespace youtube_dl_viewer.Util
{
    public static class ASPExtensions
    {
#if DEBUG
        private static readonly ConcurrentDictionary<(string,string), string> _reloadCacheText = new ConcurrentDictionary<(string,string), string>();
        private static readonly ConcurrentDictionary<(string,string), byte[]> _reloadCacheBin  = new ConcurrentDictionary<(string,string), byte[]>();
#endif
        
        private static readonly ConcurrentDictionary<string, string> _resCacheText = new ConcurrentDictionary<string, string>();
        private static readonly ConcurrentDictionary<string, byte[]> _resCacheBin  = new ConcurrentDictionary<string, byte[]>();
        
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
                        
                        var cachekey = $"${baseResPath}|{file}";
                        if (!Program.DEBUG && _resCacheBin.TryGetValue(cachekey, out var cacheResult))
                        {
                            ctxt.Response.Headers.Add("X-CACHED", "true");
                            await ctxt.Response.BodyWriter.WriteAsync(cacheResult);
                            return;
                        }

                        var dat = GetTextResource(ctxt, ass, key, baseResPath, file);
                        _resCacheText[cachekey] = dat;
                        
                        ctxt.Response.Headers.Add("X-CACHED", "false");
                        await ctxt.Response.WriteAsync(dat);
                    }
                    else if (file.ToLower().EndsWith(".js"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "application/javascript");
                        
                        var cachekey = $"${baseResPath}|{file}";
                        if (!Program.DEBUG && _resCacheBin.TryGetValue(cachekey, out var cacheResult))
                        {
                            ctxt.Response.Headers.Add("X-CACHED", "true");
                            await ctxt.Response.BodyWriter.WriteAsync(cacheResult);
                            return;
                        }

                        var dat = GetTextResource(ctxt, ass, key, baseResPath, file);
                        _resCacheText[cachekey] = dat;
                        
                        ctxt.Response.Headers.Add("X-CACHED", "false");
                        await ctxt.Response.WriteAsync(dat);
                    }
                    else if (file.ToLower().EndsWith(".svg"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
                        
                        var cachekey = $"${baseResPath}|{file}";
                        if (!Program.DEBUG && _resCacheBin.TryGetValue(cachekey, out var cacheResult))
                        {
                            ctxt.Response.Headers.Add("X-CACHED", "true");
                            await ctxt.Response.BodyWriter.WriteAsync(cacheResult);
                            return;
                        }

                        var dat = GetTextResource(ctxt, ass, key, baseResPath, file);
                        _resCacheText[cachekey] = dat;
                        
                        ctxt.Response.Headers.Add("X-CACHED", "false");
                        await ctxt.Response.WriteAsync(dat);
                    }
                    else
                    {
                        var cachekey = $"${baseResPath}|{file}";
                        if (!Program.DEBUG && _resCacheBin.TryGetValue(cachekey, out var cacheResult))
                        {
                            ctxt.Response.Headers.Add("X-CACHED", "true");
                            await ctxt.Response.BodyWriter.WriteAsync(cacheResult);
                            return;
                        }

                        var dat = GetBinResource(ctxt, ass, key, baseResPath, file);
                        _resCacheBin[cachekey] = dat;
                        
                        ctxt.Response.Headers.Add("X-CACHED", "false");
                        await ctxt.Response.BodyWriter.WriteAsync(dat);
                    }
                });
            }
        }

        public static void MapJSEmbeddedBundle(this IEndpointRouteBuilder endpoints, string path, ICollection<(string,string)> reslist)
        {
            var ass = Assembly.GetExecutingAssembly();

            endpoints.MapGet(path, async (ctxt) =>
            {
                ctxt.Response.Headers.Add(HeaderNames.ContentType, "application/javascript");

                if (!Program.DEBUG && _resCacheText.TryGetValue(path, out var cacheResult))
                {
                    ctxt.Response.Headers.Add("X-CACHED", "true");
                    await ctxt.Response.WriteAsync(cacheResult);
                    return;
                }
                
                var js = reslist
                    .Select(p => (p.Item1 + "." + p.Item2, p.Item2, p.Item1))
                    .Select(p => (p, GetTextResource(ctxt, ass, p.Item1, p.Item3, p.Item2)))
                    .Select(p => $"/* -------- [{p.Item1.Item3} :: {p.Item1.Item2}] ------ */\n\n" + p.Item2 + ";\n")
                    .Aggregate("", (a, b) => a + "\n\n" + b);

                var header = $"/* ======== {path} ======== */\n" +
                             $"/* v{Program.Version} {(Program.DEBUG ? "(debug)" : "")} */\n" +
                             $"/* {DateTime.Now:yyyy-MM-dd HH:mm:ss} */\n" + 
                             $"/* */\n";
                foreach (var (scope,file) in reslist) header += $"/* - {scope} :: {file} */\n";
                
                js = header + js;
                _resCacheText[path] = js;
                
                ctxt.Response.Headers.Add("X-CACHED", "false");
                await ctxt.Response.WriteAsync(js);
            });
        }

        public static void MapCSSEmbeddedBundle(this IEndpointRouteBuilder endpoints, string path, ICollection<(string, string)> reslist)
        {
            var ass = Assembly.GetExecutingAssembly();

            endpoints.MapGet(path, async (ctxt) =>
            {
                ctxt.Response.Headers.Add(HeaderNames.ContentType, "text/css");

                if (!Program.DEBUG && _resCacheText.TryGetValue(path, out var cacheResult))
                {
                    ctxt.Response.Headers.Add("X-CACHED", "true");
                    await ctxt.Response.WriteAsync(cacheResult);
                    return;
                }
                
                var css = reslist
                    .Select(p => (p.Item1 + "." + p.Item2, p.Item2, p.Item1))
                    .Select(p => (p, GetTextResource(ctxt, ass, p.Item1, p.Item3, p.Item2)))
                    .Select(p => $"/* -------- [{p.Item1.Item3} :: {p.Item1.Item2}] ------ */\n\n" + p.Item2 + "\n")
                    .Aggregate("", (a, b) => a + "\n\n" + b);
                
                var header = $"/* ======== {path} ======== */\n" +
                             $"/* v{Program.Version} {(Program.DEBUG ? "(debug)" : "")} */\n" +
                             $"/* {DateTime.Now:yyyy-MM-dd HH:mm:ss} */\n" + 
                             $"/* */\n";
                foreach (var (scope,file) in reslist) header += $"/* - {scope} :: {file} */\n";
                
                css = header + css;
                _resCacheText[path] = css;
                
                ctxt.Response.Headers.Add("X-CACHED", "false");
                await ctxt.Response.WriteAsync(css);
            });
        }

        private static byte[] GetBinResource(HttpContext ctxt, Assembly ass, string resourceName, string resourcePath, string resourceFilename)
        {
            using var stream = ass.GetManifestResourceStream(resourceName);
            if (stream == null) throw new ArgumentException();
            using var ms = new MemoryStream();
            
            stream.CopyTo(ms);
            var result = ms.ToArray();

#if DEBUG
            if (!_reloadCacheBin.ContainsKey((resourcePath, resourceFilename))) _reloadCacheBin[(resourcePath, resourceFilename)] = result;
            
            var resultReload = File.ReadAllBytes(GetFilesystemResourcePath(resourcePath, resourceFilename));
            if (resultReload == null)
            {
                ctxt.Response.Headers["X-LIVE_RELOADED"] = "false";
                return result;
            }
            if (_reloadCacheBin.TryGetValue((resourcePath, resourceFilename), out var cacheval) && resultReload.SequenceEqual(cacheval))
            {
                ctxt.Response.Headers["X-LIVE_RELOADED"] = "false";
                return resultReload;
            }
            
            Console.Out.WriteLine($"Reloaded [{resourcePath}|{resourceFilename}] from Filesystem");
            ctxt.Response.Headers["X-LIVE_RELOADED"] = "true";
            _reloadCacheBin[(resourcePath, resourceFilename)] = resultReload;
            return resultReload;
#endif

            return result;
        }
        
        public static string GetTextResource(HttpContext ctxt, Assembly ass, string resourceName, string resourcePath, string resourceFilename)
        {
            using var stream = ass.GetManifestResourceStream(resourceName);
            if (stream == null) throw new ArgumentException();
            using var reader = new StreamReader(stream);
            var result = reader.ReadToEnd();

#if DEBUG
            if (!_reloadCacheText.ContainsKey((resourcePath, resourceFilename))) _reloadCacheText[(resourcePath, resourceFilename)] = result;
            
            var resultReload = File.ReadAllText(GetFilesystemResourcePath(resourcePath, resourceFilename));
            if (resultReload == null)
            {
                if (ctxt != null) ctxt.Response.Headers["X-LIVE_RELOADED"] = "false";
                return result;
            }

            if (_reloadCacheText.TryGetValue((resourcePath, resourceFilename), out var cacheval) && resultReload == cacheval)
            {
                if (ctxt != null) ctxt.Response.Headers["X-LIVE_RELOADED"] = "false";
                return resultReload;
            }
            
            Console.Out.WriteLine($"Reloaded [{resourcePath}|{resourceFilename}] from Filesystem");
            if (ctxt != null) ctxt.Response.Headers["X-LIVE_RELOADED"] = "true";
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