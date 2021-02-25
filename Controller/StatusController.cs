using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer.Controller
{
    public static class StatusController
    {
        public static async Task GetStatus(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");

            var r = new JObject
            (
                new JProperty("jobs", new JObject(ListJobStatus().ToArray<object>())),
                new JProperty("cron", new JObject(ListCronStatus().ToArray<object>())),
                new JProperty("videos", new JObject(ListVideoStatus().ToArray<object>())),
                new JProperty("process", new JObject(ListProcessStatus().ToArray<object>()))
            );
            
            await context.Response.WriteAsync(r.ToString(Program.DEBUG ? Formatting.Indented : Formatting.None));
        }
        
        private static IEnumerable<JProperty> ListCronStatus()
        {
            yield return new JProperty("LastCronRefreshData",        new JObject(Cron.LastCronRefreshData.Select(p => new JProperty(p.Key.ToString(), FormatDeltaTime(p.Value))).ToArray<object>()));
            yield return new JProperty("LastAutoRefreshData",        new JObject(AutoRefreshMiddleware.LastAutoRefreshData.Select(p => new JProperty(p.Key.ToString(), FormatDeltaTime(p.Value))).ToArray<object>()));
            yield return new JProperty("LastCronConvertVideos",      FormatDeltaTime(Cron.LastCronConvertVideos));
            yield return new JProperty("LastCronGeneratePreviews",   FormatDeltaTime(Cron.LastCronGeneratePreviews));
            yield return new JProperty("LastCronGenerateThumbnails", FormatDeltaTime(Cron.LastCronGenerateThumbnails));
        }
        
        private static IEnumerable<JProperty> ListJobStatus()
        {
            yield return new JProperty("CountActiveTotal", JobRegistry.Managers.Sum(p => p.CountActive));
            yield return new JProperty("CountActive",      new JObject(JobRegistry.Managers.Select(p => new JProperty(p.Name, p.CountActive)).ToArray<object>()));
            
            yield return new JProperty("CountQueuedTotal", JobRegistry.Managers.Sum(p => p.CountQueued));
            yield return new JProperty("CountQueued",      new JObject(JobRegistry.Managers.Select(p => new JProperty(p.Name, p.CountQueued)).ToArray<object>()));
            
            yield return new JProperty("CountFinishedTotal", JobRegistry.Managers.Sum(p => p.CountFinished));
            yield return new JProperty("CountFinished",      new JObject(JobRegistry.Managers.Select(p => new JProperty(p.Name, p.CountFinished)).ToArray<object>()));
        }
        
        private static IEnumerable<JProperty> ListVideoStatus()
        {
            var vidcache = Program.GetAllCachedData();
            
            yield return new JProperty("CountCachedPreviews",   vidcache.Count(p => p.IsCachedPreview));
            yield return new JProperty("CountCachedThumbnails", vidcache.Count(p => p.IsCachedThumbnail));
                        
            yield return new JProperty("CountCachedVideosTotal",      vidcache.Count(p => p.IsCachedVideo));
            yield return new JProperty("CountCachedVideosCachable",   vidcache.Count(p => p.IsCachedVideo && p.ShouldTranscodeAndCacheVideo()));
            yield return new JProperty("CountCachedVideosAdditional", vidcache.Count(p => p.IsCachedVideo && !p.ShouldTranscodeAndCacheVideo()));
            yield return new JProperty("CountVideoCachable",          vidcache.Count(p => p.ShouldTranscodeAndCacheVideo()));
            yield return new JProperty("CountThumbCachable",          vidcache.Count(p => p.PathThumbnail != null && Program.Args.CreateResizedThumbnails));
                        
            yield return new JProperty("CountTotal", vidcache.Count);
                        
            yield return new JProperty("FilesizeCachedPreviews",   FormatBytes(vidcache.Sum(p => p.CachePreviewSize)));
            yield return new JProperty("FilesizeCachedThumbnails", FormatBytes(vidcache.Sum(p => p.CacheThumbnailSize)));
            yield return new JProperty("FilesizeCachedVideos",     FormatBytes(vidcache.Sum(p => p.CacheVideoSize)));
        }
        
        private static IEnumerable<JProperty> ListProcessStatus()
        {
            using var proc = Process.GetCurrentProcess();
            
            yield return new JProperty("PrivateMemorySize",        FormatBytes(proc.PrivateMemorySize64));
            yield return new JProperty("PagedMemorySize",          FormatBytes(proc.PagedMemorySize64));
            yield return new JProperty("PeakPagedMemorySize",      FormatBytes(proc.PeakPagedMemorySize64));
            yield return new JProperty("NonpagedSystemMemorySize", FormatBytes(proc.NonpagedSystemMemorySize64));
            yield return new JProperty("VirtualMemorySize",        FormatBytes(proc.VirtualMemorySize64));
            yield return new JProperty("PeakVirtualMemorySize",    FormatBytes(proc.PeakVirtualMemorySize64));
            yield return new JProperty("PagedSystemMemorySize",    FormatBytes(proc.PagedSystemMemorySize64));
            
            yield return new JProperty("PrivilegedProcessorTime", FormatTimeSpan(proc.PrivilegedProcessorTime));
            yield return new JProperty("UserProcessorTime",       FormatTimeSpan(proc.UserProcessorTime));
            yield return new JProperty("TotalProcessorTime",      FormatTimeSpan(proc.TotalProcessorTime));
            
            yield return new JProperty("BasePriority", proc.BasePriority);
            
            yield return new JProperty("GCTotalMemory", FormatBytes(GC.GetTotalMemory(false)));
            yield return new JProperty("WorkingSet",    FormatBytes(Environment.WorkingSet));
            
            yield return new JProperty("ThreadCount", proc.Threads.Count);
            yield return new JProperty("HandleCount", proc.HandleCount);
            
            yield return new JProperty("Handle",      proc.Handle.ToInt64());
            yield return new JProperty("Id",          proc.Id);
            yield return new JProperty("ProcessName", proc.ProcessName);
            
            yield return new JProperty("StartTime", proc.StartTime.ToString("yyyy-MM-dd HH:mm:ss"));
            yield return new JProperty("UpTime",    FormatTimeSpan(DateTime.Now - proc.StartTime));
            
            yield return new JProperty("TickCount", FormatTimeSpan(TimeSpan.FromMilliseconds(Environment.TickCount64)));
        }

        private static string BytesToStr(long byteCount)
        {
            string[] suf = { "byte", "KB", "MB", "GB", "TB", "PB", "EB" }; //Longs run out around EB
            if (byteCount == 0) return "0" + " " + suf[0];
            var bytes = Math.Abs(byteCount);
            var place = Convert.ToInt32(Math.Floor(Math.Log(bytes, 1024)));
            var num = Math.Round(bytes / Math.Pow(1024, place), 1);
            return (Math.Sign(byteCount) * num) + " " + suf[place];
        }
        
        private static JObject FormatBytes(long bytes)
        {
            return new JObject
            (
                new JProperty("raw", bytes),
                new JProperty("type", "bytes"),
                new JProperty("format", BytesToStr(bytes))
            );
        }
        
        private static string FormatMilliseconds(long v)
        {
            if (v < 0) return string.Empty; 

            var days    = (int)(v / 1000f / 60f / 60f / 24f);
            var hours   = (int)((v-days * 1000 * 60 * 60 * 24) / 1000f / 60f / 60f);
            var minutes = (int)((v-hours * 1000 * 60 * 60) / 1000f / 60f);
            var seconds = (int)((v - minutes * 1000 * 60) / 1000f);
            var millis  = v - minutes * 1000 * 60 - seconds * 1000;

            if (days    > 0) return $"{days} days {hours:00}h {minutes:00}m {seconds:00}s {millis}ms";

            if (hours   > 0) return $"{hours}h {minutes:00}m {seconds:00}s {millis}ms";

            if (minutes > 0) return $"{minutes}m {seconds:00}s {millis}ms";
            
            if (seconds > 0) return $"{seconds}s {millis}ms";
                
            return $"{millis}ms";
        }
        
        private static JObject FormatTimeSpan(TimeSpan ts)
        {
            return new JObject
            (
                new JProperty("raw", new JObject
                (
                    new JProperty("TotalMilliseconds", ts.TotalMilliseconds),
                    new JProperty("TotalSeconds",      ts.TotalSeconds),
                    new JProperty("TotalMinutes",      ts.TotalMinutes),
                    new JProperty("TotalHours",        ts.TotalHours),
                    new JProperty("TotalDays",         ts.TotalDays)
                )),
                new JProperty("type", "TimeSpan"),
                new JProperty("format", FormatMilliseconds((int)ts.TotalMilliseconds))
            );
        }
        
        private static JObject FormatDeltaTime(DateTime? ts)
        {
            return new JObject
            (
                new JProperty("iso", ts?.ToString("O")),
                new JProperty("delta", new JObject
                (
                    new JProperty("TotalMilliseconds", ts!=null ? (DateTime.Now-ts.Value).TotalMilliseconds : 0),
                    new JProperty("format", FormatMilliseconds((long)(ts!=null ?  (DateTime.Now-ts.Value).TotalMilliseconds : 0)))
                )),
                new JProperty("type", "DateTime"),
                new JProperty("format", ts==null ? "NULL" : $"{ts:yyyy-MM-dd HH:mm:ss} ({FormatMilliseconds((long)(DateTime.Now-ts.Value).TotalMilliseconds)} ago)"   )
            );
        }
    }
}