using System;
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
                        await ctxt.Response.BodyWriter.WriteAsync(GetBinResource(ass, key));
                    }
                    else if (file.ToLower().EndsWith(".js"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "application/javascript");
                        await ctxt.Response.WriteAsync(GetTextResource(ass, key));
                    }
                    else if (file.ToLower().EndsWith(".svg"))
                    {
                        ctxt.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
                        await ctxt.Response.WriteAsync(GetTextResource(ass, key));
                    }
                    else
                    {
                        await ctxt.Response.BodyWriter.WriteAsync(GetBinResource(ass, key));
                    }
                });
            }
        }
        
        public static byte[] GetBinResource(Assembly ass ,string resourceName)
        {
            using var stream = ass.GetManifestResourceStream(resourceName);
            if (stream == null) throw new ArgumentException();
            using var ms = new MemoryStream();
            
            stream.CopyTo(ms);
            return ms.ToArray();
        }
        
        public static string GetTextResource(Assembly ass ,string resourceName)
        {
            using var stream = ass.GetManifestResourceStream(resourceName);
            if (stream == null) throw new ArgumentException();
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
        
    }
}