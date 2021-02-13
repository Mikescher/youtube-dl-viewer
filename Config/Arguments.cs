using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using ImageMagick;
using youtube_dl_viewer.Jobs;

namespace youtube_dl_viewer.Config
{
    public class Arguments
    {
        public ThumbnailExtractionMode ThumbnailExtraction = ThumbnailExtractionMode.Sequential;

        public List<DataDirSpec> DataDirs = new List<DataDirSpec>();
        
        public List<ThemeSpec> Themes = new List<ThemeSpec>
        {
            new ThemeSpec(0, "default",  "theme_default.css",  null),
            new ThemeSpec(1, "dark",     "theme_dark.css",     null),
            new ThemeSpec(2, "darkblue", "theme_darkblue.css", null),
            new ThemeSpec(3, "pastel",   "theme_pastel.css",   null),
        };

        public List<(string, string)> RawArgumentValues = new List<(string, string)>();
        
        [IntConfig("--max-parallel-convert")]
        public int MaxParallelConvertJobs    = 1;
        
        [IntConfig("--max-parallel-genprev")]
        public int MaxParallelGenPreviewJobs = 2;

        [IntConfig("--max-parallel-genthumb")] 
        public int MaxParallelGenThumbnailJobs = 5;
        
        [IntConfig("--preview-width")]
        public int PreviewImageWidth = 480;

        [BoolConfig("--ffmpeg", "--no-ffmpeg")]
        public bool UseFFMPEG = true;

        [BoolConfig("--open-browser", null)]
        public bool AutoOpenBrowser = false;

        [BoolConfig(null, "--no-auto-previews")]
        public bool AutoPreviewGen = true;
        
        [StringConfig("--webm-convert-params")]
        public string ConvertFFMPEGParams = @"-vb 256k -cpu-used -5 -deadline realtime";

        [StringConfig("--ffmpeg-debug-dir")]
        public string FFMPEGDebugDir = null;
        
        [IntConfig("--previewcount-max")]
        public int MaxPreviewImageCount = 32;
        
        [IntConfig("--previewcount-min")]
        public int MinPreviewImageCount = 8;
        
        [IntEnumConfig("--display", new[]{"grid", "compact", "tabular", "detailed", "gridx2", "grid_half", "timeline"})]
        public int OptDisplayMode   = 0; // grid
        
        [IntEnumConfig("--width", new[]{"small", "medium", "wide", "full"})]
        public int OptWidthMode     = 1; // medium
        
        [IntEnumConfig("--order", new[]{"date-desc", "date-asc", "title", "category", "views", "rating", "uploader", "external-desc", "external-asc", "random", "filename-asc", "filename-desc"})]
        public int OptOrderMode     = 0; // date-desc
        
        [IntEnumConfig("--thumbnailmode", new[]{"off", "intelligent", "sequential", "parallel"})]
        public int OptThumbnailMode = 1; // intelligent
        
        [IntEnumConfig("--videomode", new[]{"disabled", "raw-seekable", "raw", "transcoded", "download", "vlc-stream", "vlc-local", "url"})]
        public int OptVideoMode     = 4; // download
        
        [StringConfig("--theme")]
        public string OptThemeMode  = "default";
        public int OptThemeModeInt => (Themes.FirstOrDefault(p => p.Name == OptThemeMode))?.Index ?? 0;

        [BoolConfig("--help", null)]
        public bool OptHelp = false;

        [BoolConfig("--version", null)]
        public bool OptVersion = false;
        
        [BoolConfig("--debug", null)]
        public bool ForceDebug = false;
        
        [BoolConfig("--no-debug", null)]
        public bool NoDebug    = false;

        [IntConfig("--port")]
        public int Port = -1;

        [StringConfig("--cache")]
        public string CacheDir = null;

        [StringConfig("--exec-ffmpeg")]
        public string FFMPEGExec  = "ffmpeg";
        
        [StringConfig("--exec-ffprobe")]
        public string FFPROBEExec = "ffprobe";

        [IntConfig("--autorefresh-interval")]
        public int AutoRefreshInterval = -1; // seconds
        
        [IntConfig("--cronrefresh-interval")]
        public int CronRefreshInterval = -1; // seconds

        [DirectBoolConfig("--cron-refresh")]
        public bool CronDoRefresh = true;
        
        [DirectBoolConfig("--cron-genprev")]
        public bool CronDoGeneratePreviews = false;
        
        [DirectBoolConfig("--cron-convert")]
        public bool CronDoConvertVideos = false;
        
        [DirectBoolConfig("--cron-genthumbs")]
        public bool CronDoGenerateThumbnails = true;
        
        [BoolConfig("--trim-info-json", "--no-trim-info-json")]
        public bool TrimDataJSON = true;
        
        [StringConfig("--htmltitle")]
        public string HTMLTitle = $"youtube-dl Viewer (v{Program.Version})";

        [BoolConfig("--resized-thumbs", "--no-resized-thumbs")]
        public bool CreateResizedThumbnails = true;

        [StringConfig("--scaled-thumbnail-format")]
        public MagickFormat ThumbnailFormat = MagickFormat.WebP;

        [StringConfig("--config-location")]
        public string ExtConfigLocation = null;
        
        public string ExtConfigContent = null;
        
        public void Parse(IEnumerable<string> args)
        {
            foreach (var arg in args) ParseSingleArgument(arg, true);
            
            if (!DataDirs.Any()) DataDirs = new List<DataDirSpec>{ DataDirSpec.FromPath(Environment.CurrentDirectory) };

            if (Port == -1) Port = FindFreePort();
        }

        private void ParseSingleArgument(string arg, bool allowConfigFile)
        {
            var key = arg;
            string value = null;
            var idx = arg.IndexOf("=", StringComparison.Ordinal);
            if (idx != -1)
            {
                key   = arg.Substring(0, idx).ToLower();
                value = arg.Substring(idx + 1);
            }
            RawArgumentValues.Add((key, value));
        
            if (arg.ToLower() == "--help" || arg.ToLower() == "-h") { OptHelp                 = true;  return; }
            
            if (arg.ToLower() == "--version")                       { OptVersion              = true;  return; }
            if (arg.ToLower() == "--no-ffmpeg")                     { UseFFMPEG               = false; return; }
            if (arg.ToLower() == "--ffmpeg")                        { UseFFMPEG               = true;  return; }
            if (arg.ToLower() == "--open-browser")                  { AutoOpenBrowser         = true;  return; }
            if (arg.ToLower() == "--no-auto-previews")              { AutoPreviewGen          = false; return; }
            if (arg.ToLower() == "--trim-info-json")                { TrimDataJSON            = true;  return; }
            if (arg.ToLower() == "--no-trim-info-json")             { TrimDataJSON            = false; return; }
            if (arg.ToLower() == "--debug")                         { ForceDebug              = false; return; }
            if (arg.ToLower() == "--no-debug")                      { NoDebug                 = false; return; }
            if (arg.ToLower() == "--resized-thumbs")                { CreateResizedThumbnails = true;  return; }
            if (arg.ToLower() == "--no-resized-thumbs")             { CreateResizedThumbnails = false; return; }
            
            if (!arg.StartsWith("--")) throw new Exception($"Unknown argument: '{arg}'. Use --help for a list of commandline parameters");
            key = key.Substring(2);
            
            if (value == null) throw new Exception($"Unknown argument: '{arg}'. Use --help for a list of commandline parameters");

            if (value.StartsWith("\"") && value.EndsWith("\"")) value = value.Substring(1, value.Length - 2);
            
            if (key == "config-location")
            {
                if (!allowConfigFile) throw new Exception($"Nested use config-location is not allowed");
                ExtConfigLocation = value;
                ExtConfigContent = File.ReadAllText(value);
                ParseArgumentsFromFile(value);
                return;
            }
            
            if (key == "path")      { DataDirs.Add(DataDirSpec.Parse(value));           return; }
            if (key == "usertheme") { Themes.Add(ThemeSpec.Parse(value, Themes.Count)); return; }
            
            if (key == "display")                 { OptDisplayMode              = ParseDisplayMode(value);                                               return; }
            if (key == "order")                   { OptOrderMode                = ParseOrderMode(value);                                                 return; }
            if (key == "width")                   { OptWidthMode                = ParseWidthMode(value);                                                 return; }
            if (key == "thumbnailmode")           { OptThumbnailMode            = ParseThumbnailMode(value);                                             return; }
            if (key == "videomode")               { OptVideoMode                = ParseVideoMode(value);                                                 return; }
            if (key == "theme")                   { OptThemeMode                = (value.EndsWith(".css") ? value.Substring(0, value.Length-4) : value); return; }
            if (key == "port")                    { Port                        = int.Parse(value);                                                      return; }
            if (key == "cache")                   { CacheDir                    = value.Replace("/", Path.DirectorySeparatorChar.ToString());            return; }
            if (key == "max-parallel-convert")    { MaxParallelConvertJobs      = int.Parse(value);                                                      return; }
            if (key == "max-parallel-genprev")    { MaxParallelGenPreviewJobs   = int.Parse(value);                                                      return; }
            if (key == "max-parallel-genthumb")   { MaxParallelGenThumbnailJobs = int.Parse(value);                                                      return; }
            if (key == "preview-width")           { PreviewImageWidth           = int.Parse(value);                                                      return; }
            if (key == "webm-convert-params")     { ConvertFFMPEGParams         = value;                                                                 return; }
            if (key == "thumnail-ex-mode")        { ThumbnailExtraction         = ParseThumbnailExtractionMode(value);                                   return; }
            if (key == "previewcount-max")        { MaxPreviewImageCount        = int.Parse(value);                                                      return; }
            if (key == "previewcount-min")        { MinPreviewImageCount        = Math.Max(2, int.Parse(value));                                         return; }
            if (key == "ffmpeg-debug-dir")        { FFMPEGDebugDir              = value.Replace("/", Path.DirectorySeparatorChar.ToString());            return; }
            if (key == "exec-ffmpeg")             { FFMPEGExec                  = value;                                                                 return; }
            if (key == "exec-ffprobe")            { FFPROBEExec                 = value;                                                                 return; }
            if (key == "autorefresh-interval")    { AutoRefreshInterval         = int.Parse(value);                                                      return; }
            if (key == "cronrefresh-interval")    { CronRefreshInterval         = int.Parse(value);                                                      return; }
            if (key == "htmltitle")               { HTMLTitle                   = value;                                                                 return; }
            if (key == "cron-refresh")            { CronDoRefresh               = bool.Parse(value);                                                     return; }
            if (key == "cron-genprev")            { CronDoGeneratePreviews      = bool.Parse(value);                                                     return; }
            if (key == "cron-convert")            { CronDoConvertVideos         = bool.Parse(value);                                                     return; }
            if (key == "cron-genthumbs")          { CronDoGenerateThumbnails    = bool.Parse(value);                                                     return; }
            if (key == "scaled-thumbnail-format") { ThumbnailFormat             = ParseThumbnailFormat(value);                                           return; }

            throw new Exception($"Unknown argument: '{arg}'. Use --help for a list of commandline parameters");
        }

        public static int ParseDisplayMode(string v)
        {
            switch (v)
            {
                case "0": case "grid":      return 0;
                case "1": case "compact":   return 1;
                case "2": case "tabular":   return 2;
                case "3": case "detailed":  return 3;
                case "4": case "gridx2":    return 4;
                case "5": case "grid_half": return 5;
                case "6": case "timeline":  return 6;
            }

            throw new Exception($"Invalid value '{v}' for [display]");
        }
        
        public static int ParseOrderMode(string v)
        {
            switch (v)
            {
                case "0":  case "date-desc":      return 0;
                case "1":  case "date-asc":       return 1;
                case "2":  case "title":          return 2;
                case "3":  case "category":       return 3;
                case "4":  case "views":          return 4;
                case "5":  case "rating":         return 5;
                case "6":  case "uploader":       return 6;
                case "7":  case "external-desc":  return 7;
                case "8":  case "external-asc":   return 8;
                case "9":  case "random":         return 9;
                case "10": case "filename-asc":   return 10;
                case "11": case "filename-desc":  return 11;
            }

            throw new Exception($"Invalid value '{v}' for [order]");
        }
        
        public static int ParseWidthMode(string v)
        {
            switch (v)
            {
                case "0":  case "small":      return 0;
                case "1":  case "medium":     return 1;
                case "2":  case "wide":       return 2;
                case "3":  case "full":       return 3;
            }

            throw new Exception($"Invalid value '{v}' for [width]");
        }
        
        public static int ParseThumbnailMode(string v)
        {
            switch (v)
            {
                case "0":  case "off":         return 0;
                case "1":  case "intelligent": return 1;
                case "2":  case "sequential":  return 2;
                case "3":  case "parallel":    return 3;
            }

            throw new Exception($"Invalid value '{v}' for [thumbnail]");
        }
        
        public static int ParseVideoMode(string v)
        {
            switch (v)
            {
                case "0": case "disabled":     return 0;
                case "1": case "raw-seekable": return 1;
                case "2": case "raw":          return 2;
                case "3": case "transcoded":   return 3;
                case "4": case "download":     return 4;
                case "5": case "vlc-stream":   return 5;
                case "6": case "vlc-local":    return 6;
                case "7": case "url":          return 7;
            }

            throw new Exception($"Invalid value '{v}' for [display]");
        }
        
        public static MagickFormat ParseThumbnailFormat(string v)
        {
            switch (v.ToLower())
            {
                case "webp": return MagickFormat.WebP;
                case "png":  return MagickFormat.Png;
                case "bmp":  return MagickFormat.Bmp;
                case "jpg":  return MagickFormat.Jpeg;
                case "jpeg": return MagickFormat.Jpeg;
                case "gif":  return MagickFormat.Gif;
            }

            throw new Exception($"Invalid value '{v}' for [thumbnail-format]");
        }

        public static ThumbnailExtractionMode ParseThumbnailExtractionMode(string v)
        {
            switch (v)
            {
                case "0": case "seq":    case "sequential":    return ThumbnailExtractionMode.Sequential;
                case "1":                case "parallel":      return ThumbnailExtractionMode.Parallel;
                case "2": case "single": case "singlecommand": return ThumbnailExtractionMode.SingleCommand;
            }

            throw new Exception($"Invalid value '{v}' for [thumnail-ex-mode]");
        }

        private void ParseArgumentsFromFile(string filepath)
        {
            var text = string.Join(" ", File.ReadAllLines(filepath)
                .Select(p => p.Trim())
                .Where(p => !p.StartsWith("#"))
                .Where(p => !string.IsNullOrWhiteSpace(p)));

            foreach (var arg in SplitArgs(text)) ParseSingleArgument(arg, false);
        }
        
        private static IEnumerable<string> SplitArgs(string commandLine)
        {
            var result = new StringBuilder();

            var quoted = false;
            var escaped = false;
            var started = false;
            var allowcaret = false;
            for (var i = 0; i < commandLine.Length; i++)
            {
                var chr = commandLine[i];

                if (chr == '^' && !quoted)
                {
                    if (allowcaret)
                    {
                        result.Append(chr);
                        started = true;
                        escaped = false;
                        allowcaret = false;
                    }
                    else if (i + 1 < commandLine.Length && commandLine[i + 1] == '^')
                    {
                        allowcaret = true;
                    }
                    else if (i + 1 == commandLine.Length)
                    {
                        result.Append(chr);
                        started = true;
                        escaped = false;
                    }
                }
                else if (escaped)
                {
                    result.Append(chr);
                    started = true;
                    escaped = false;
                }
                else if (chr == '"')
                {
                    quoted = !quoted;
                    started = true;
                }
                else if (chr == '\\' && i + 1 < commandLine.Length && commandLine[i + 1] == '"')
                {
                    escaped = true;
                }
                else if (chr == ' ' && !quoted)
                {
                    if (started) yield return result.ToString();
                    result.Clear();
                    started = false;
                }
                else
                {
                    result.Append(chr);
                    started = true;
                }
            }

            if (started) yield return result.ToString();
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
            Console.Out.WriteLine("  -h --help                   Show this screen.");
            Console.Out.WriteLine("  --version                   Show version.");
            Console.Out.WriteLine("  --port=<value>              The server port");
            Console.Out.WriteLine("  --cache=<value>             Cache directory for transcoded webm files,");
            Console.Out.WriteLine("                                generated thumbnails and preview frames");
            Console.Out.WriteLine("  --path=<value>              Path to the video data");
            Console.Out.WriteLine("                                # (default = current_dir)");
            Console.Out.WriteLine("                                # can be specified multiple times");
            Console.Out.WriteLine("                                # can either contain a simple directory");
            Console.Out.WriteLine("                                # or a complex json object (see README)");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --config-location=<path>    Include configurations from a file");
            Console.Out.WriteLine("                                # The specified file must be a simple textfile which contains");
            Console.Out.WriteLine("                                # arguments as if they were directly supplied to the program.");
            Console.Out.WriteLine("                                # Lines can be commented with the '#' character.");
            Console.Out.WriteLine("                                # Syntax/idea is similar to the argument with the same name in youtube-dl");
            Console.Out.WriteLine("  --display=<value>           The intial display mode");
            Console.Out.WriteLine("                                # [grid]      Grid");
            Console.Out.WriteLine("                                # [compact]   Compact");
            Console.Out.WriteLine("                                # [tabular]   Tabular");
            Console.Out.WriteLine("                                # [detailed]  Detailed");
            Console.Out.WriteLine("                                # [gridx2]    Grid (x2)");
            Console.Out.WriteLine("                                # [grid_half] Grid (1/2)");
            Console.Out.WriteLine("                                # [timeline]  Timeline");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --order=<value>             The intial display order");
            Console.Out.WriteLine("                                # [date-desc]     Date [descending]");
            Console.Out.WriteLine("                                # [date-asc]      Date [ascending]");
            Console.Out.WriteLine("                                # [title]         Title");
            Console.Out.WriteLine("                                # [category]      Category");
            Console.Out.WriteLine("                                # [views]         Views");
            Console.Out.WriteLine("                                # [rating]        Rating");
            Console.Out.WriteLine("                                # [uploader]      Uploader");
            Console.Out.WriteLine("                                # [external-desc] External [descending] (if available)");
            Console.Out.WriteLine("                                # [external-asc]  External [ascending] (if available)");
            Console.Out.WriteLine("                                # [random]        Random");
            Console.Out.WriteLine("                                # [filename-asc]  Filename [ascending]");
            Console.Out.WriteLine("                                # [filename-desc] Filename [descending]");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --width=<value>             The intial display list width");
            Console.Out.WriteLine("                                # [small]  Small");
            Console.Out.WriteLine("                                # [medium] Medium");
            Console.Out.WriteLine("                                # [wide]   Wide");
            Console.Out.WriteLine("                                # [full]   Full");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --thumbnailmode=<value>     The intial thumbnail loading mode");
            Console.Out.WriteLine("                                # [off]         Off");
            Console.Out.WriteLine("                                # [intelligent] On (intelligent)");
            Console.Out.WriteLine("                                # [sequential]  On (sequential)");
            Console.Out.WriteLine("                                # [parallel]    On (parallel)");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --videomode=<value>         The intial video playback mode");
            Console.Out.WriteLine("                                # [disabled]     Disabled");
            Console.Out.WriteLine("                                # [raw-seekable] Seekable raw file");
            Console.Out.WriteLine("                                # [raw]          Raw file");
            Console.Out.WriteLine("                                # [transcoded]   Transcoded webm stream");
            Console.Out.WriteLine("                                # [download]     Download file");
            Console.Out.WriteLine("                                # [vlc-stream]   VLC Protocol Link (stream)"); // https://github.com/stefansundin/vlc-protocol
            Console.Out.WriteLine("                                # [vlc-local]    VLC Protocol Link (local)");  // https://github.com/stefansundin/vlc-protocol
            Console.Out.WriteLine("                                # [url]          Open original Webpage");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --theme=<value>             The intial theme");
            Console.Out.WriteLine("                                # Can either be:");
            Console.Out.WriteLine("                                # [default] The default theme");
            Console.Out.WriteLine("                                # or one of the user-defined themes from the --usertheme arguments");
            Console.Out.WriteLine("                                #");
            Console.Out.WriteLine("  --usertheme=<path>          Add additional user-supplied themes");
            Console.Out.WriteLine("                                # <path> must be a path to an css file");
            Console.Out.WriteLine("                                # You can add more than one user theme");
            Console.Out.WriteLine("  --autorefresh-interval=<t>  Automatically trigger a refresh (reload data from filesytem)");
            Console.Out.WriteLine("                                if the last refresh is longer than <t> seconds ago.");
            Console.Out.WriteLine("                                Only triggers on web requests, if the webapp is not used the");
            Console.Out.WriteLine("                                interval can be longer");
            Console.Out.WriteLine("  --cronrefresh-interval=<t>  Automatically trigger a cron run");
            Console.Out.WriteLine("                                every <t> seconds.");
            Console.Out.WriteLine("                                The cron job can execute various operations (Default: refresh data)");
            Console.Out.WriteLine("                                This one triggers without any user interaction.");
            Console.Out.WriteLine("                                Default := -1 (disabled)");
            Console.Out.WriteLine("  --cron-refresh=<b>          Refresh data (reload data from filesytem) in cron execution");
            Console.Out.WriteLine("                                Values  := [true|false]");
            Console.Out.WriteLine("                                Default := true");
            Console.Out.WriteLine("  --cron-genprev=<b>          Generate preview images in cron execution");
            Console.Out.WriteLine("                                Values  := [true|false]");
            Console.Out.WriteLine("                                Default := false");
            Console.Out.WriteLine("  --cron-genthumbs=<b>        Generate optimized/scaled thumbnails in cron execution");
            Console.Out.WriteLine("                                Values  := [true|false]");
            Console.Out.WriteLine("                                Default := false");
            Console.Out.WriteLine("  --cron-convert=<b>          Generate transcoded videos in cron execution");
            Console.Out.WriteLine("                                (only for applicable videos)");
            Console.Out.WriteLine("                                Values  := [true|false]");
            Console.Out.WriteLine("                                Default := false");
            Console.Out.WriteLine("  --max-parallel-convert=<v>  Maximum amount of parallel ffmpeg calls to");
            Console.Out.WriteLine("                                transcode video files to (stream-able) webm");
            Console.Out.WriteLine("                                Default := " + MaxParallelConvertJobs);
            Console.Out.WriteLine("  --max-parallel-genprev=<v>  Maximum amount of parallel ffmpeg calls to generate");
            Console.Out.WriteLine("                                thumbnails and preview images");
            Console.Out.WriteLine("                                Default := " + MaxParallelGenPreviewJobs);
            Console.Out.WriteLine("  --max-parallel-genthumb=<v> Maximum amount of parallel generate resized thumbnail jobs");
            Console.Out.WriteLine("                                Default := " + MaxParallelGenThumbnailJobs);
            Console.Out.WriteLine("  --webm-convert-params=<v>   Additional parameters in ffmpeg call for video");
            Console.Out.WriteLine("                                to (stream-able) webm");
            Console.Out.WriteLine("                                Default := '" + ConvertFFMPEGParams + "'");
            Console.Out.WriteLine("  --exec-ffmpeg=<path>        Alternative path to the ffmpeg executable");
            Console.Out.WriteLine("  --exec-ffprobe=<path>       Alternative path to the ffprobe executable");
            Console.Out.WriteLine("  --no-ffmpeg                 Disable all features that depend on a");
            Console.Out.WriteLine("                                system ffmpeg installation");
            Console.Out.WriteLine("                                # - live webm transcode");
            Console.Out.WriteLine("                                # - generated thumbnails");
            Console.Out.WriteLine("                                # - hover preview");
            Console.Out.WriteLine("                                # - ...");
            Console.Out.WriteLine("  --preview-width=<value>     Width for generated preview and thumbnail images");
            Console.Out.WriteLine("                                Default := " + PreviewImageWidth);
            Console.Out.WriteLine("  --thumnail-ex-mode=<v>      The algorithm to create preview images from the video file");
            Console.Out.WriteLine("                                # [sequential]    Multiple calls to ffmpeg to");
            Console.Out.WriteLine("                                #                   extract single frames (only one call at a time)");
            Console.Out.WriteLine("                                #                   (only one call at a time)");
            Console.Out.WriteLine("                                # [parallel]      Multiple calls to ffmpeg to");
            Console.Out.WriteLine("                                #                   extract single frames");
            Console.Out.WriteLine("                                #                   (all calls parallel)");
            Console.Out.WriteLine("                                # [singlecommand] SingleCommand: Only a single call to ffmpeg");
            Console.Out.WriteLine("                                #                   with an fps filter");
            Console.Out.WriteLine("  --previewcount-max=<v>      The max amount of generated preview images per video");
            Console.Out.WriteLine("                                Default := " + MaxPreviewImageCount);
            Console.Out.WriteLine("  --previewcount-min=<v>      The minimum amount of generated preview images per video");
            Console.Out.WriteLine("                                Default := " + MinPreviewImageCount);
            Console.Out.WriteLine("  --no-auto-previews          Do not automatically generate all previews in the background");
            Console.Out.WriteLine("  --open-browser              Automatically open browser after webserver");
            Console.Out.WriteLine("                                is started (only works on desktop)");
            Console.Out.WriteLine("  --ffmpeg-debug-dir=<dir>    Directory where all ffmpeg ouput is written to (for debugging)");
            Console.Out.WriteLine("  --no-trim-info-json         Do not reduce the size of the /json ajax request by only returning");
            Console.Out.WriteLine("                                values from the *.info.json file that are actually used");
            Console.Out.WriteLine("  --htmltitle                 Change the webpage title");
            Console.Out.WriteLine("  --no-resized-thumbs         Do not create (and cache) optimized/scaled thumbnails");
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