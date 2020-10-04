using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer
{
    public class Arguments
    {
        public ThumbnailExtractionMode ThumbnailExtraction = ThumbnailExtractionMode.Sequential;

        public List<DataDirSpec> DataDirs = new List<DataDirSpec>();
        
        public List<ThemeSpec> Themes = new List<ThemeSpec> { new ThemeSpec(0, "default", "theme_default.css", null) };

        public int MaxParallelConvertJobs    = 1;
        public int MaxParallelGenPreviewJobs = 2;

        public int PreviewImageWidth = 480;

        public bool NoFFMPEG = false;

        public bool AutoOpenBrowser = false;

        public bool AutoPreviewGen = true;
        
        public string ConvertFFMPEGParams = @"-vb 256k -cpu-used -5 -deadline realtime";

        public string FFMPEGDebugDir = null;
        
        public int MaxPreviewImageCount = 32;
        public int MinPreviewImageCount = 8;
        
        public int OptDisplayMode   = 0;
        public int OptWidthMode     = 1;
        public int OptOrderMode     = 0;
        public int OptThumbnailMode = 1;
        public int OptVideoMode     = 4;
        
        public string OptThemeMode  = "default";
        public int OptThemeModeInt => (Themes.FirstOrDefault(p => p.Name == OptThemeMode))?.Index ?? 0;

        public bool OptHelp = false;

        public bool OptVersion = false;

        public int Port = -1;

        public string CacheDir = null;

        public string FFMPEGExec  = "ffmpeg";
        public string FFPROBEExec = "ffprobe";

        public int AutoRefreshInterval = -1; // seconds
        public int CronRefreshInterval = -1; // seconds

        public bool TrimDataJSON = false;
        
        public string HTMLTitle = $"youtube-dl Viewer (v{Program.Version})";
        
        public void Parse(IEnumerable<string> args)
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
                    NoFFMPEG = false;
                    continue;
                }
                
                if (arg.ToLower() == "--open-browser")
                {
                    AutoOpenBrowser = true;
                    continue;
                }
                
                if (arg.ToLower() == "--no-auto-previews")
                {
                    AutoPreviewGen = false;
                    continue;
                }
                
                if (arg.ToLower() == "--trim-info-json")
                {
                    TrimDataJSON = true;
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
                if (key == "theme")                OptThemeMode              = (value.EndsWith(".css") ? value.Substring(0, value.Length-4) : value);
                if (key == "path")                 DataDirs.Add(DataDirSpec.Parse(value));
                if (key == "port")                 Port                      = int.Parse(value);
                if (key == "cache")                CacheDir                  = value;
                if (key == "max-parallel-convert") MaxParallelConvertJobs    = int.Parse(value);
                if (key == "max-parallel-genprev") MaxParallelGenPreviewJobs = int.Parse(value);
                if (key == "preview-width")        PreviewImageWidth         = int.Parse(value);
                if (key == "webm-convert-params")  ConvertFFMPEGParams       = value;
                if (key == "thumnail-ex-mode")     ThumbnailExtraction       = (ThumbnailExtractionMode)int.Parse(value);
                if (key == "previewcount-max")     MaxPreviewImageCount      = int.Parse(value);
                if (key == "previewcount-min")     MinPreviewImageCount      = Math.Max(2, int.Parse(value));
                if (key == "ffmpeg-debug-dir")     FFMPEGDebugDir            = value;
                if (key == "exec-ffmpeg")          FFMPEGExec                = value;
                if (key == "exec-ffprobe")         FFPROBEExec               = value;
                if (key == "autorefresh-interval") AutoRefreshInterval       = int.Parse(value);
                if (key == "cronrefresh-interval") CronRefreshInterval       = int.Parse(value);
                if (key == "htmltitle")            HTMLTitle                 = value;
                if (key == "usertheme")            Themes.Add(ThemeSpec.Parse(value, Themes.Count));
            }
            
            if (!DataDirs.Any()) DataDirs = new List<DataDirSpec>{ DataDirSpec.FromPath(Environment.CurrentDirectory) };

            if (Port == -1) Port = FindFreePort();
        }

        public void PrintHelp()
        {
            Console.Out.WriteLine($"youtube-dl-viewer v{Program.Version}");
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
            Console.Out.WriteLine("                               # can either contain a simple directory");
            Console.Out.WriteLine("                               # or a complex json object (see README)");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --display=<value>          The intial display mode");
            Console.Out.WriteLine("                               # [0] Grid");
            Console.Out.WriteLine("                               # [1] Compact");
            Console.Out.WriteLine("                               # [2] Tabular");
            Console.Out.WriteLine("                               # [3] Detailed");
            Console.Out.WriteLine("                               # [4] Grid (x2)");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --order=<value>            The intial display order");
            Console.Out.WriteLine("                               # [0] Date [descending]");
            Console.Out.WriteLine("                               # [1] Date [ascending]");
            Console.Out.WriteLine("                               # [2] Title");
            Console.Out.WriteLine("                               # [3] Category");
            Console.Out.WriteLine("                               # [4] Views");
            Console.Out.WriteLine("                               # [5] Rating");
            Console.Out.WriteLine("                               # [6] Uploader");
            Console.Out.WriteLine("                               # [7] External [descending] (if available)");
            Console.Out.WriteLine("                               # [8] External [ascending] (if available)");
            Console.Out.WriteLine("                               # [9] Random");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --width=<value>            The intial display list width");
            Console.Out.WriteLine("                               # [0] Small");
            Console.Out.WriteLine("                               # [1] Medium");
            Console.Out.WriteLine("                               # [2] Wide");
            Console.Out.WriteLine("                               # [3] Full");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --thumbnailmode=<value>    The intial thumbnail loading mode");
            Console.Out.WriteLine("                               # [0] Off");
            Console.Out.WriteLine("                               # [1] On (intelligent)");
            Console.Out.WriteLine("                               # [2] On (sequential)");
            Console.Out.WriteLine("                               # [3] On (parallel)");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --videomode=<value>        The intial video playback mode");
            Console.Out.WriteLine("                               # [0] Disabled");
            Console.Out.WriteLine("                               # [1] Seekable raw file");
            Console.Out.WriteLine("                               # [2] Raw file");
            Console.Out.WriteLine("                               # [3] Transcoded webm stream");
            Console.Out.WriteLine("                               # [4] Download file");
            Console.Out.WriteLine("                               # [5] VLC Protocol Link (stream)"); // https://github.com/stefansundin/vlc-protocol
            Console.Out.WriteLine("                               # [6] VLC Protocol Link (local)");  // https://github.com/stefansundin/vlc-protocol
            Console.Out.WriteLine("                               # [7] Open original Webpage");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --theme=<value>            The intial theme");
            Console.Out.WriteLine("                               # Can either be:");
            Console.Out.WriteLine("                               # [default] The default theme");
            Console.Out.WriteLine("                               # or one of the user-defined themes from the --usertheme arguments");
            Console.Out.WriteLine("                               #");
            Console.Out.WriteLine("  --usertheme=<path>         Add additional user-supplied themes");
            Console.Out.WriteLine("                               # <path> must be a path to an css file");
            Console.Out.WriteLine("                               # You can add more than one user theme");
            Console.Out.WriteLine("  --autorefresh-interval=<t> Automatically trigger a refresh (reload data from filesytem)");
            Console.Out.WriteLine("                               if the last refresh is longer than <t> seconds ago.");
            Console.Out.WriteLine("                               Only triggers on web requests, if the webapp is not used the");
            Console.Out.WriteLine("                               interval can be longer");
            Console.Out.WriteLine("  --cronrefresh-interval=<t> Automatically trigger a refresh (reload data from filesytem)");
            Console.Out.WriteLine("                               every <t> seconds.");
            Console.Out.WriteLine("                               This one also triggers without any user interaction.");
            Console.Out.WriteLine("                               Default := -1 (disabled)");
            Console.Out.WriteLine("  --max-parallel-convert=<v> Maximum amount of parallel ffmpeg calls to");
            Console.Out.WriteLine("                               transcode video files to (stream-able) webm");
            Console.Out.WriteLine("                               Default := " + MaxParallelConvertJobs);
            Console.Out.WriteLine("  --max-parallel-genprev=<v> Maximum amount of parallel ffmpeg calls to generate");
            Console.Out.WriteLine("                               thumbnails and preview images");
            Console.Out.WriteLine("                               Default := " + MaxParallelGenPreviewJobs);
            Console.Out.WriteLine("  --webm-convert-params=<v>  Additional parameters in ffmpeg call for video");
            Console.Out.WriteLine("                               to (stream-able) webm");
            Console.Out.WriteLine("                               Default := '" + ConvertFFMPEGParams + "'");
            Console.Out.WriteLine("  --exec-ffmpeg=<path>       Alternative path to the ffmpeg executable");
            Console.Out.WriteLine("  --exec-ffprobe=<path>      Alternative path to the ffprobe executable");
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
            Console.Out.WriteLine("  --ffmpeg-debug-dir=<dir>   Directory where all ffmpeg ouput is written to (for debugging)");
            Console.Out.WriteLine("  --trim-info-json           Reduce the size of the /json ajax request by only returning");
            Console.Out.WriteLine("                               values from the *.info.json file that are actually used");
            Console.Out.WriteLine("  --htmltitle                Change the webpage title");
            Console.Out.WriteLine();
        }

        private int FindFreePort()
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
    }
}