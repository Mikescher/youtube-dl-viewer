﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using ImageMagick;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;
using youtube_dl_viewer.Jobs;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Controller
{
    public static class ThumbnailController
    {
        public static readonly Dictionary<ushort, MagickFormat> MAGICK_CONVERSION_TABLE = new() // values from Magick.NET-Q8-AnyCPU 7.23.2
        {
            {7, MagickFormat.APng},
            {18, MagickFormat.Bmp},
            {87, MagickFormat.Heif},
            {95, MagickFormat.Ico},
            {110, MagickFormat.Jpeg},
            {111, MagickFormat.Jpg},
            {179, MagickFormat.Png},
            {180, MagickFormat.Png00},
            {181, MagickFormat.Png24},
            {182, MagickFormat.Png32},
            {183, MagickFormat.Png48},
            {184, MagickFormat.Png64},
            {185, MagickFormat.Png8},
            {201, MagickFormat.Rgb},
            {202, MagickFormat.Rgb565},
            {203, MagickFormat.Rgba},
            {217, MagickFormat.Sixel},
            {226, MagickFormat.Tga},
            {228, MagickFormat.Tif},
            {229, MagickFormat.Tiff},
            {230, MagickFormat.Tiff64},
            {248, MagickFormat.WebP},
        };
        
        public static string GetThumbnailCachePath(string pathVideo)
        {
            if (pathVideo == null) return null;
            if (Program.Args.CacheDir == null) return null;
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return Path.Combine(Program.Args.CacheDir, "thumb_" + Path.GetRelativePath(Program.CurrentDir, pathVideo).ToLower().Sha256() + ".dat");
            else
                return Path.Combine(Program.Args.CacheDir, "thumb_" + pathVideo.Sha256() + ".dat");
        }
        
        public static async Task GetThumbnailWait(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];
            
            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            if (!Program.Args.CreateResizedThumbnails) { context.Response.Headers.Add("ThumbSourceType", "DirectFallback_NoOpt");   await GetThumbnailDirect(context); return; }
            if (Program.Args.CacheDir == null)         { context.Response.Headers.Add("ThumbSourceType", "DirectFallback_NoDir");   await GetThumbnailDirect(context); return; }
            if (vid.PathThumbnail == null)             { context.Response.Headers.Add("ThumbSourceType", "DirectFallback_NoThumb"); await GetThumbnailDirect(context); return; }
            
            var tfile = GetThumbnailCachePath(vid.PathVideo);

            var sizearg  = (string)context.Request.RouteValues["size"];
            var insize = -1;
            
            if (sizearg == "xs")     insize = 0;
            else if (sizearg == "s") insize = 1;
            else if (sizearg == "m") insize = 2;
            else if (sizearg == "o") insize = 3;
            else throw new Exception("Invalid {size} value");
            
            if (!File.Exists(tfile))
            {
                using (var proxy = JobRegistry.ThumbGenJobs.StartOrQueue((man) => new ThumbnailGenJob(man, vid, tfile)))
                {
                    while (proxy.JobRunningOrWaiting) await Task.Delay(50);

                    if (proxy.Killed) { context.Response.StatusCode = 500; await context.Response.WriteAsync("Job was killed prematurely"); return; }
                }
                
                context.Response.Headers.Add("ThumbSourceType", "FromTriggeredJob");
                await GetThumbnailFromFile(tfile, insize, context.Response);
            }
            else
            {
                context.Response.Headers.Add("ThumbSourceType", "FromCache");
                await GetThumbnailFromFile(tfile, insize, context.Response);
            }
            
        }

        public static async Task GetThumbnailFast(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];
            
            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            if (!Program.Args.CreateResizedThumbnails) { context.Response.Headers.Add("ThumbSourceType", "DirectFallback_NoOpt");   await GetThumbnailDirect(context); return; }
            if (Program.Args.CacheDir == null)         { context.Response.Headers.Add("ThumbSourceType", "DirectFallback_NoDir");   await GetThumbnailDirect(context); return; }
            if (vid.PathThumbnail == null)             { context.Response.Headers.Add("ThumbSourceType", "DirectFallback_NoThumb"); await GetThumbnailDirect(context); return; }
            
            var tfile = GetThumbnailCachePath(vid.PathVideo);

            var sizearg  = (string)context.Request.RouteValues["size"];
            var insize = -1;
            
            if (sizearg == "xs")     insize = 0;
            else if (sizearg == "s") insize = 1;
            else if (sizearg == "m") insize = 2;
            else if (sizearg == "o") insize = 3;
            else throw new Exception("Invalid {size} value");

            if (File.Exists(tfile))
            {
                context.Response.Headers.Add("ThumbSourceType", "FromCache");
                await GetThumbnailFromFile(tfile, insize, context.Response);
            }
            else
            {
                context.Response.Headers.Add("ThumbSourceType", "DirectButJobQueued");
                JobRegistry.ThumbGenJobs.StartOrQueue((man) => new ThumbnailGenJob(man, vid, tfile), false);
                await GetThumbnailDirect(context); 
            }
        }

        public static async Task GetThumbnailOriginal(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];
            
            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            var pathThumbnail = vid.PathThumbnail;
            if (pathThumbnail == null)
            {
                context.Response.StatusCode = 404; 
                await context.Response.WriteAsync("Thumbnail not found"); 
                return;
            }
            
            if (Path.GetExtension(pathThumbnail).Equals(".png",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/png");
            if (Path.GetExtension(pathThumbnail).Equals(".svg",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
            if (Path.GetExtension(pathThumbnail).Equals(".jpg",  StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).Equals(".jpeg", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).Equals(".webp", StringComparison.InvariantCultureIgnoreCase)) context.Response.Headers.Add(HeaderNames.ContentType, "image/webp");

            await context.Response.SendFileAsync(pathThumbnail);
        }
        
        private static StringValues MagickToContentType(MagickFormat fmt)
        {
            if (fmt == MagickFormat.Bmp)  return "image/bmp";
            if (fmt == MagickFormat.Png)  return "image/png";
            if (fmt == MagickFormat.WebP) return "image/webp";
            if (fmt == MagickFormat.Jpeg) return "image/jpeg";
            if (fmt == MagickFormat.Gif)  return "image/gif";
            if (fmt == MagickFormat.Svg)  return "image/svg+xml";

            throw new Exception("Unsuoported magick format: " + fmt);
        }

        private static async Task GetThumbnailFromFile(string path, int size, HttpResponse resp)
        {
            await using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            
            int dataOffset;
            int dataSize;
            MagickFormat dataFormat;
                
            using (var br = new BinaryReader(fs, Encoding.UTF8, true))
            {
                var pre1 = br.ReadByte();
                var pre2 = br.ReadByte();
                var pre3 = br.ReadByte();
                var vers = br.ReadByte();

                if (pre1 != 24) throw new Exception($"Thumbnail cache file {path} is damaged (invalid fheader)");
                if (pre2 != 34) throw new Exception($"Thumbnail cache file {path} is damaged (invalid fheader)");
                if (pre3 != 52) throw new Exception($"Thumbnail cache file {path} is damaged (invalid fheader)");
                    
                if (vers != 1) throw new Exception($"Thumbnail cache file {path} cannot be read (unknown version)");

                br.ReadInt64();

                for (var i = 0; i < size; i++)
                {
                    br.ReadInt32();
                    br.ReadInt32();
                    br.ReadInt16();
                }
                    
                dataOffset = br.ReadInt32();
                dataSize   = br.ReadInt32();
                dataFormat = MAGICK_CONVERSION_TABLE[br.ReadUInt16()];
                
                resp.Headers.Add(HeaderNames.ContentType, MagickToContentType(dataFormat));
            }

            fs.Seek(dataOffset, SeekOrigin.Begin);

            await fs.CopyToAsync(resp.Body, dataSize);
        }
        
        public static async Task GetThumbnailDirect(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            var id  = (string)context.Request.RouteValues["id"];

            if (!(await Program.GetData(idx)).Videos.TryGetValue(id, out var vid)) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video not found"); return; }

            var pathVideo = vid.PathVideo;
            
            var pathThumbnail = vid.PathThumbnail;
            if (vid.PathThumbnail == null)
            {
                if (pathVideo == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Video file not found"); return; }

                await PreviewController.GetPreviewImage(context, pathVideo, idx, id, 1);
                return;
            }
            
            var data = await File.ReadAllBytesAsync(pathThumbnail);
            
            context.Response.Headers.Add(HeaderNames.ContentLength, WebUtility.UrlEncode(data.Length.ToString()));
            context.Response.Headers.Add(HeaderNames.ContentDisposition, "attachment;filename=\"" + WebUtility.UrlEncode(Path.GetFileName(pathThumbnail))+"\"");

            if (Path.GetExtension(pathThumbnail).EqualsIgnoreCase(".png"))  context.Response.Headers.Add(HeaderNames.ContentType, "image/png");
            if (Path.GetExtension(pathThumbnail).EqualsIgnoreCase(".svg"))  context.Response.Headers.Add(HeaderNames.ContentType, "image/svg+xml");
            if (Path.GetExtension(pathThumbnail).EqualsIgnoreCase(".jpg"))  context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).EqualsIgnoreCase(".jpeg")) context.Response.Headers.Add(HeaderNames.ContentType, "image/jpeg");
            if (Path.GetExtension(pathThumbnail).EqualsIgnoreCase(".webp")) context.Response.Headers.Add(HeaderNames.ContentType, "image/webp");
            
            await context.Response.BodyWriter.WriteAsync(data);
        }

        public static ushort MagickFormatToUint16(MagickFormat v)
        {
            foreach (var t in MAGICK_CONVERSION_TABLE)
            {
                if (t.Value == v) return t.Key;
            }
            throw new Exception("Unsupported magick format: " + v);
        }
    }
}