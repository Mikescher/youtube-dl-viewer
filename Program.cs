using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Controller;
using youtube_dl_viewer.Jobs;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer
{
    public class Program
    {
        public static readonly string[] ExtVideo     = { "mkv", "mp4", "webm", "avi", "flv", "wmv", "mpg", "mpeg" };
        public static readonly string[] ExtThumbnail = { "jpg", "jpeg", "webp", "png" };

        public static string Version => "0.13";

        private static string _currentDir = null;
        public static string CurrentDir => _currentDir ??= Environment.CurrentDirectory;

        public static ThumbnailExtractionMode ThumbnailExtraction = ThumbnailExtractionMode.Sequential;

        public static List<string> DataDirs = new List<string>();
        public static Dictionary<int, (string json, Dictionary<string, JObject> obj)> Data = new Dictionary<int, (string json, Dictionary<string, JObject> obj)>();
        
        public static int MaxParallelConvertJobs    = 3;
        public static int MaxParallelGenPreviewJobs = 2;

        public static int PreviewImageWidth = 480;

        public static bool HasValidFFMPEG = true;

        public static bool AutoOpenBrowser = false;

        public static bool AutoPreviewGen = true;
        
        public static string ConvertFFMPEGParams = @"-vb 256k -cpu-used -5 -deadline realtime";

        public static int MaxPreviewImageCount = 32;
        public static int MinPreviewImageCount = 8;
        
        /*
         * [0] ListStyle: Grid
         * [1] ListStyle: Compact
         * [2] ListStyle: Tabular
         * [3] ListStyle: Detailed
         */
        public static int OptDisplayMode = 0;

        /*
         * [0] Width: Small
         * [1] Width: Medium
         * [2] Width: Wide
         * [3] Width: Full
         */
        public static int OptWidthMode = 1;

        /*
         * [0] Sorting: Date [descending]
         * [1] Sorting: Date [ascending]
         * [2] Sorting: Title
         * [3] Sorting: Category
         * [4] Sorting: Views
         * [5] Sorting: Rating
         * [6] Sorting: Uploader
         */
        public static int OptOrderMode = 0;

        /*
         * [0] Thumbnails: Off
         * [1] Thumbnails: On (intelligent)
         * [2] Thumbnails: On (sequential)
         * [3] Thumbnails: On (parallel)
         */
        public static int OptThumbnailMode = 1;

        /*
         * [0] Playback: Disabled
         * [1] Playback: Seekable raw file
         * [2] Playback: Raw file
         * [3] Playback: Transcoded Webm stream
         * [4] Playback: Download file
         * [5] Playback: VLC Protocol Link
         */
        public static int OptVideoMode = 4;

        public static bool OptHelp = false;

        public static bool OptVersion = false;

        public static int Port = -1;

        public static string CacheDir = null;

        public static void Main(string[] args)
        {
            ParseArgs(args);

            if (!DataDirs.Any()) DataDirs = new List<string>{ Environment.CurrentDirectory };

            if (Port == -1) Port = FindFreePort();

            if (OptHelp)
            {
                Console.Out.WriteLine($"youtube-dl-viewer v{Version}");
                Console.Out.WriteLine();
                Console.Out.WriteLine("Usage:");
                Console.Out.WriteLine("  youtube-dl-viewer");
                Console.Out.WriteLine("  youtube-dl-viewer -h | --help");
                Console.Out.WriteLine("  youtube-dl-viewer --version");
                Console.Out.WriteLine();
                Console.Out.WriteLine("Options:");
                Console.Out.WriteLine("  -h --help                  Show this screen.");
                Console.Out.WriteLine("  --version                  Show version.");
                Console.Out.WriteLine("  --port=<value>             The server port");
                Console.Out.WriteLine("  --cache=<value>            Cache directory for transcoded webm files,");
                Console.Out.WriteLine("                               generated thumbnails and preview frames");
                Console.Out.WriteLine("  --path=<value>             Path to the video data");
                Console.Out.WriteLine("                               # (default = current_dir)");
                Console.Out.WriteLine("                               # can be specified multiple times");
                Console.Out.WriteLine("                               #");
                Console.Out.WriteLine("  --display=<value>          The display mode");
                Console.Out.WriteLine("                               # [0] Disabled");
                Console.Out.WriteLine("                               # [1] Seekable raw file");
                Console.Out.WriteLine("                               # [2] Raw file");
                Console.Out.WriteLine("                               # [3] Transcoded Webm stream");
                Console.Out.WriteLine("                               # [4] Download file");
                Console.Out.WriteLine("                               #");
                Console.Out.WriteLine("  --order=<value>            The display order");
                Console.Out.WriteLine("                               # [0] Date [descending]");
                Console.Out.WriteLine("                               # [1] Date [ascending]");
                Console.Out.WriteLine("                               # [2] Title");
                Console.Out.WriteLine("                               # [3] Category");
                Console.Out.WriteLine("                               # [4] Views");
                Console.Out.WriteLine("                               # [5] Rating");
                Console.Out.WriteLine("                               # [6] Uploader");
                Console.Out.WriteLine("                               #");
                Console.Out.WriteLine("  --width=<value>            The display list width");
                Console.Out.WriteLine("                               # [0] Small");
                Console.Out.WriteLine("                               # [1] Medium");
                Console.Out.WriteLine("                               # [2] Wide");
                Console.Out.WriteLine("                               # [3] Full");
                Console.Out.WriteLine("                               #");
                Console.Out.WriteLine("  --thumbnailmode=<value>    The thumbnail loading mode");
                Console.Out.WriteLine("                               # [0] Off");
                Console.Out.WriteLine("                               # [1] On (intelligent)");
                Console.Out.WriteLine("                               # [2] On (sequential)");
                Console.Out.WriteLine("                               # [3] On (parallel)");
                Console.Out.WriteLine("                               #");
                Console.Out.WriteLine("  --videomode=<value>        The video playback mode");
                Console.Out.WriteLine("                               # [0] Disabled");
                Console.Out.WriteLine("                               # [1] Seekable raw file");
                Console.Out.WriteLine("                               # [2] Raw file");
                Console.Out.WriteLine("                               # [3] Transcoded webm stream");
                Console.Out.WriteLine("                               # [4] Download file");
                Console.Out.WriteLine("                               # [5] VLC Protocol Link (stream)"); // https://github.com/stefansundin/vlc-protocol
                Console.Out.WriteLine("                               # [6] VLC Protocol Link (local)");  // https://github.com/stefansundin/vlc-protocol
                Console.Out.WriteLine("                               #");
                Console.Out.WriteLine("  --max-parallel-convert=<v> Maximum amount of parallel ffmpeg calls to");
                Console.Out.WriteLine("                               transcode video files to (stream-able) webm");
                Console.Out.WriteLine("                               Default := " + MaxParallelConvertJobs);
                Console.Out.WriteLine("  --max-parallel-genprev=<v> Maximum amount of parallel ffmpeg calls to generate");
                Console.Out.WriteLine("                               thumbnails and preview images");
                Console.Out.WriteLine("                               Default := " + MaxParallelGenPreviewJobs);
                Console.Out.WriteLine("  --webm-convert-params=<v>  Additional parameters in ffmpeg call for video");
                Console.Out.WriteLine("                               to (stream-able) webm");
                Console.Out.WriteLine("                               Default := '" + ConvertFFMPEGParams + "'");
                Console.Out.WriteLine("  --no-ffmpeg                Disable all features that depend on a");
                Console.Out.WriteLine("                               system ffmpeg installation");
                Console.Out.WriteLine("                               # - live webm transcode");
                Console.Out.WriteLine("                               # - generated thumbnails");
                Console.Out.WriteLine("                               # - hover preview");
                Console.Out.WriteLine("                               # - ...");
                Console.Out.WriteLine("  --preview-width=<value>    Width for generated preview and thumbnail images");
                Console.Out.WriteLine("                               Default := " + PreviewImageWidth);
                Console.Out.WriteLine("  --thumnail-ex-mode=<v>     The algorithm to create preview images from the video file");
                Console.Out.WriteLine("                               # [0] Sequential: Multiple calls to ffmpeg to");
                Console.Out.WriteLine("                               #                 extract single frames (only one call at a time)");
                Console.Out.WriteLine("                               #                 (only one call at a time)");
                Console.Out.WriteLine("                               # [1] Parallel: Multiple calls to ffmpeg to");
                Console.Out.WriteLine("                               #               extract single frames");
                Console.Out.WriteLine("                               #               (all calls parallel)");
                Console.Out.WriteLine("                               # [2] SingleCommand: Only a single call to ffmpeg");
                Console.Out.WriteLine("                               #                    with an fps filter");
                Console.Out.WriteLine("  --previewcount-max=<v>     The max amount of generated preview images per video");
                Console.Out.WriteLine("                               Default := " + MaxPreviewImageCount);
                Console.Out.WriteLine("  --previewcount-min=<v>     The minimum amount of generated preview images per video");
                Console.Out.WriteLine("                               Default := " + MinPreviewImageCount);
                Console.Out.WriteLine("  --no-auto-previews         Do not automatically generate all previews in the background");
                Console.Out.WriteLine("  --open-browser             Automatically open browser after webserver");
                Console.Out.WriteLine("                               is started (only works on desktop)");
                Console.Out.WriteLine();
                return;
            }

            if (OptVersion)
            {
                Console.Out.WriteLine(Version);
                return;
            }

            for (var i = 0; i < DataDirs.Count; i++)
            {
                Console.Out.WriteLine($"> Start enumerating video data [{i}]: {DataDirs[i]}");
                RefreshData(i);
                Console.Out.WriteLine($"> Video data enumerated: {Data[i].obj.Count} entries found");
                Console.Out.WriteLine();
            }

            if (HasValidFFMPEG) // if disabled by cmd switch then wwe don't need to check
            {
                Console.Out.WriteLine($"> Verifying ffmpeg installation");
                VerifyFFMPEG();
                Console.Out.WriteLine();
            }
            
            Console.Out.WriteLine();
            Console.Out.WriteLine($"[#] Starting webserver on http://localhost:{Port}/");
            Console.Out.WriteLine();

            if (AutoOpenBrowser)
            {
                Console.Out.WriteLine("[#] Launching Webbrowser");
                
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                    Process.Start(new ProcessStartInfo($"http://localhost:{Port}/") { UseShellExecute = true });
                else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                    Process.Start("xdg-open", $"http://localhost:{Port}/");
                else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                    Process.Start("open", $"http://localhost:{Port}/");
                
                Console.Out.WriteLine();
            }
            
            
            CreateHostBuilder(args).Build().Run();
        }

        private static void VerifyFFMPEG()
        {
            try
            {
                var proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "ffmpeg",
                        Arguments = "-version",
                        CreateNoWindow = true,
                    }
                };

                proc.Start();
                proc.WaitForExit();
                if (proc.ExitCode != 0) throw new Exception("Exitcode");
                
                Console.Out.WriteLine($"  : ffmpeg installation seems to be ok");
                HasValidFFMPEG = true;
            }
            catch (Exception)
            {
                Console.Out.WriteLine($"  : ffmpeg could not be found ... disabling live transcode and preview generators");
                HasValidFFMPEG = false;
            }
        }

        private static void ParseArgs(IEnumerable<string> args)
        {
            foreach (var arg in args)
            {
                if (arg.ToLower() == "--help" || arg.ToLower() == "-h")
                {
                    OptHelp = true;
                    continue;
                }
                
                if (arg.ToLower() == "--version")
                {
                    OptVersion = true;
                    continue;
                }
                
                if (arg.ToLower() == "--no-ffmpeg")
                {
                    HasValidFFMPEG = false;
                    continue;
                }
                
                if (arg.ToLower() == "--open-browser")
                {
                    AutoOpenBrowser = true;
                    continue;
                }
                
                if (arg.ToLower() == "--no-auto-previews ")
                {
                    AutoPreviewGen = false;
                    continue;
                }
                
                if (!arg.StartsWith("--")) continue;
                
                var idx = arg.IndexOf("=", StringComparison.Ordinal);

                var key   = arg.Substring(2, idx - 2).ToLower();
                var value = arg.Substring(idx + 1);

                if (value.StartsWith("\"") && value.EndsWith("\"")) value = value.Substring(1, value.Length - 2);

                if (key == "display")              OptDisplayMode            = int.Parse(value);
                if (key == "order")                OptOrderMode              = int.Parse(value);
                if (key == "width")                OptWidthMode              = int.Parse(value);
                if (key == "thumbnailmode")        OptThumbnailMode          = int.Parse(value);
                if (key == "videomode")            OptVideoMode              = int.Parse(value);
                if (key == "path")                 DataDirs.Add(value);
                if (key == "port")                 Port                      = int.Parse(value);
                if (key == "cache")                CacheDir                  = value;
                if (key == "max-parallel-convert") MaxParallelConvertJobs    = int.Parse(value);
                if (key == "max-parallel-genprev") MaxParallelGenPreviewJobs = int.Parse(value);
                if (key == "preview-width")        PreviewImageWidth         = int.Parse(value);
                if (key == "webm-convert-params")  ConvertFFMPEGParams       = value;
                if (key == "thumnail-ex-mode")     ThumbnailExtraction       = (ThumbnailExtractionMode)int.Parse(value);
                if (key == "previewcount-max")     MaxPreviewImageCount      = int.Parse(value);
                if (key == "previewcount-min")     MinPreviewImageCount      = Math.Max(2, int.Parse(value));
            }
        }

        private static IHostBuilder CreateHostBuilder(string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.UseUrls($"http://localhost:{Port}/");
                });
        }

        private static int FindFreePort()
        {
            int port;
            var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            try
            {
                var localEp = new IPEndPoint(IPAddress.Any, 0);
                socket.Bind(localEp);
                localEp = (IPEndPoint)socket.LocalEndPoint;
                port = localEp.Port;
            }
            finally
            {
                socket.Close();
            }
            return port;
        }

        public static string RefreshData(int index)
        {
            var datafiles = Directory.EnumerateFiles(DataDirs[index]).OrderBy(p => p.ToLower()).ToList();
            var processedFiles = new List<string>();

            var filesSubs = datafiles.Where(p => p.EndsWith(".vtt")).ToList();
            var filesInfo = datafiles.Where(p => p.EndsWith(".info.json")).ToList();

            var resultVideos = new JArray();

            var idsAreUnique = true;
            var idlist = new HashSet<string>();

            var cacheFiles = (CacheDir == null)
                ? new HashSet<string>()
                : Directory.EnumerateFiles(CacheDir).Select(Path.GetFileName).ToHashSet();
            
            foreach (var pathJson in filesInfo)
            {
                JObject jinfo;
                try
                {
                    jinfo = JObject.Parse(File.ReadAllText(pathJson));
                }
                catch (Exception e)
                {
                    throw new Exception($"Could not parse file: '{pathJson}'", e);
                }

                var id = jinfo.Value<string>("id");
                if (id == null || idlist.Contains(id)) idsAreUnique = false;
                idlist.Add(id);
                
                var dir = Path.GetDirectoryName(pathJson);
                if (dir == null) continue;

                var filenameJson = Path.GetFileName(pathJson);

                var filenameBase = filenameJson.Substring(0, filenameJson.Length - ".info.json".Length);

                var pathDesc = Path.Combine(dir, filenameBase + ".description");
                if (!datafiles.Contains(pathDesc)) pathDesc = null;

                var pathVideo = ExtVideo.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => datafiles.Contains(p));
                if (pathVideo == null) continue;

                var pathThumb = ExtThumbnail.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => datafiles.Contains(p));

                var pathSubs = filesSubs
                    .Where(p => dir == Path.GetDirectoryName(p))
                    .Where(p => Path.GetFileName(p).EndsWith(".vtt"))
                    .Where(p => Path.GetFileName(p).StartsWith(filenameBase + "."))
                    .ToList();
                
                processedFiles.Add(pathJson);
                if (pathDesc != null) processedFiles.Add(pathDesc);
                if (pathThumb != null) processedFiles.Add(pathThumb);
                processedFiles.Add(pathVideo);
                processedFiles.AddRange(pathSubs);
                
                resultVideos.Add(new JObject
                (
                    new JProperty("meta", new JObject
                    (
                        new JProperty("uid", id),
                        
                        new JProperty("directory", dir),
                        
                        new JProperty("filename_base", filenameBase),
                        
                        new JProperty("path_json", pathJson),
                        new JProperty("path_description", pathDesc),
                        new JProperty("path_video", pathVideo),
                        new JProperty("path_video_abs", Path.GetFullPath(pathVideo)),
                        new JProperty("path_thumbnail", pathThumb),
                        new JProperty("paths_subtitle", new JObject(pathSubs.Select(p => new JProperty(Path.GetFileNameWithoutExtension(p).Substring(filenameBase.Length+1), p)))),
                        
                        new JProperty("cache_file", VideoController.GetStreamCachePath(pathVideo)),
                        new JProperty("cached", cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo)))),
                        new JProperty("previewscache_file", ThumbnailController.GetPreviewCachePath(pathVideo)),
                        new JProperty("cached_previews", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo))))
                    )),
                    new JProperty("data", new JObject
                    (
                        new JProperty("info", jinfo),
                        new JProperty("description", (pathDesc != null) ? File.ReadAllText(pathDesc) : null)
                    ))
                ));
            }

            foreach (var pathVideo in datafiles.Except(processedFiles).Where(p => ExtVideo.Any(q => string.Equals("." + q, Path.GetExtension(p), StringComparison.CurrentCultureIgnoreCase))))
            {
                var id = pathVideo.Sha256();
                if (id == null || idlist.Contains(id)) idsAreUnique = false;
                idlist.Add(id);
                
                var dir = Path.GetDirectoryName(pathVideo);
                if (dir == null) continue;

                var filenameVideo = Path.GetFileName(pathVideo);

                var filenameBase = Path.GetFileNameWithoutExtension(filenameVideo);

                var pathDesc = Path.Combine(dir, filenameBase + ".description");
                if (!datafiles.Contains(pathDesc)) pathDesc = null;

                var pathThumb = ExtThumbnail.Select(ext => Path.Combine(dir, filenameBase + "." + ext)).FirstOrDefault(p => datafiles.Contains(p));

                var pathSubs = filesSubs
                    .Where(p => dir == Path.GetDirectoryName(p))
                    .Where(p => Path.GetFileName(p).EndsWith(".vtt"))
                    .Where(p => Path.GetFileName(p).StartsWith(filenameBase + "."))
                    .ToList();
                
                if (pathDesc != null) processedFiles.Add(pathDesc);
                if (pathThumb != null) processedFiles.Add(pathThumb);
                processedFiles.Add(pathVideo);
                processedFiles.AddRange(pathSubs);
                
                resultVideos.Add(new JObject
                (
                    new JProperty("meta", new JObject
                    (
                        new JProperty("uid", id),
                        
                        new JProperty("directory", dir),
                        
                        new JProperty("filename_base", filenameBase),
                        
                        new JProperty("path_json", (object)null),
                        new JProperty("path_description", pathDesc),
                        new JProperty("path_video", pathVideo),
                        new JProperty("path_video_abs", Path.GetFullPath(pathVideo)),
                        new JProperty("path_thumbnail", pathThumb),
                        new JProperty("paths_subtitle", new JObject(pathSubs.Select(p => new JProperty(Path.GetFileNameWithoutExtension(p).Substring(filenameBase.Length+1), p)))),
                        
                        new JProperty("cache_file", VideoController.GetStreamCachePath(pathVideo)),
                        new JProperty("cached", cacheFiles.Contains(Path.GetFileName(VideoController.GetStreamCachePath(pathVideo)))),
                        new JProperty("previewscache_file", ThumbnailController.GetPreviewCachePath(pathVideo)),
                        new JProperty("cached_previews", cacheFiles.Contains(Path.GetFileName(ThumbnailController.GetPreviewCachePath(pathVideo))))
                    )),
                    new JProperty("data", new JObject
                    (
                        new JProperty("info", new JObject
                        (
                            new JProperty("title", Path.GetFileNameWithoutExtension(pathVideo))
                        )),
                        new JProperty("description", (pathDesc != null) ? File.ReadAllText(pathDesc) : null)
                    ))
                ));
            }

            if (!idsAreUnique)
            {
                var uid = 10000;
                foreach (var rv in resultVideos)
                {
                    rv["meta"]?["uid"]?.Replace(new JProperty("uid", uid.ToString()));
                    uid++;
                }
            }

            var result = new JObject
            (
                new JProperty("videos", resultVideos),
                new JProperty("missing", new JArray(datafiles.Except(processedFiles).ToArray<object>()))
            );

            var jsonstr = result.ToString(Formatting.Indented);
            var jsonobj = resultVideos.ToDictionary(rv => rv["meta"]?.Value<string>("uid"), rv => (JObject) rv);
            
            Data[index] = (jsonstr, jsonobj);

            return jsonstr;
        }
    }
}