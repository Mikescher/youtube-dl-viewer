using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer.Config
{
    public class DataDirSpec
    {
        public readonly int Index;
        
        public readonly string InputSpec;
        
        public readonly string Path;
        public readonly string Name;
        public readonly bool UseFilenameAsTitle;
        public readonly int RecursionDepth;
        public readonly string FilenameFilter;
        public readonly string OrderFilename;
        public readonly bool UpdateOrderFile;
        public readonly string HTMLTitle;
        
        public readonly int?   DisplayOverride;
        public readonly int?   WidthOverride;
        public readonly int?   OrderOverride;
        public readonly int?   VideomodeOverride;
        public readonly int?   ThumbnailmodeOverride;
        public readonly string ThemeOverride;
        
        public readonly HashSet<int>    DisabledDisplays;
        public readonly HashSet<int>    DisabledWidths;
        public readonly HashSet<int>    DisabledOrders;
        public readonly HashSet<int>    DisabledVideomodes;
        public readonly HashSet<int>    DisabledThumbnailmodes;
        public readonly HashSet<string> DisabledThemes;

        public readonly string SelectorID;

        public string FullOrderFilename
        {
            get
            {
                if (OrderFilename == null) return null;
                return System.IO.Path.Combine(Path, OrderFilename);
            }
        }

        private DataDirSpec(int index, string spec, string path, string name, 
            bool useFilenameAsTitle, int recursionDepth, string filenameFilter, string orderFilename, bool updateOrderfile, string htmltitle,
            int? display_override, int? width_override, int? order_override, int? videomode_override, int? thumbnailmode_override, string theme_override,
            IEnumerable<int> disabled_display, IEnumerable<int> disabled_width, IEnumerable<int> disabled_order, IEnumerable<int> disabled_videomode, IEnumerable<int> disabled_thumbnailmode, IEnumerable<string> disabled_theme)
        {
            Index = index;
            
            InputSpec          = spec;
            Path               = path?.Replace("/", System.IO.Path.DirectorySeparatorChar.ToString());
            Name               = name;
            UseFilenameAsTitle = useFilenameAsTitle;
            RecursionDepth     = recursionDepth;
            FilenameFilter     = filenameFilter;
            OrderFilename      = orderFilename?.Replace("/", System.IO.Path.DirectorySeparatorChar.ToString());
            UpdateOrderFile    = updateOrderfile;
            HTMLTitle          = htmltitle;
            
            DisplayOverride       = display_override;
            WidthOverride         = width_override;
            OrderOverride         = order_override;
            VideomodeOverride     = videomode_override;
            ThumbnailmodeOverride = thumbnailmode_override;
            ThemeOverride         = theme_override;
            
            DisabledDisplays       = disabled_display.ToHashSet();
            DisabledWidths         = disabled_width.ToHashSet();
            DisabledOrders         = disabled_order.ToHashSet();
            DisabledVideomodes     = disabled_videomode.ToHashSet();
            DisabledThumbnailmodes = disabled_thumbnailmode.ToHashSet();
            DisabledThemes         = disabled_theme.ToHashSet();
            
            SelectorID = Regex.Replace(Name, @"[^A-Za-z0-9_\-.,;]", "_").ToLower();
            
            if (!Directory.Exists(Path)) throw new Exception($"Path not found: '{Path}'");
            
            if (OrderFilename != null && !File.Exists(FullOrderFilename)) throw new Exception($"Order file not found: '{FullOrderFilename}'");
        }

        public OrderingList GetOrdering()
        {
            return OrderFilename != null ? OrderingList.ParseFromFile(FullOrderFilename, UpdateOrderFile) : null;
        }
        
        public static DataDirSpec Parse(int index, string spec)
        {
            if (!spec.Trim().StartsWith("{")) return FromPath(index, spec);

            var json = JObject.Parse(spec);

            var path = json.Value<string>("path");
            if (path == null) throw new Exception("Cannot parse extended path-spec (missing 'path' attribute)");

            var name = json.Value<string>("name") ?? path;

            var useFilename = json.GetValue("use_filename_as_title")?.Value<bool>() ?? false;
            
            var recDepth = json.GetValue("recursion")?.Value<int>() ?? 0;
            
            var filter = json.Value<string>("filter") ?? "*";

            var order = json.GetValue("ext_order")?.Value<string>();
            
            var updateorderfile = json.GetValue("update_ext_order")?.Value<bool>() ?? true;
            
            var raw_ovr_display       = json.GetValue("display")?.Value<string>();
            var raw_ovr_width         = json.GetValue("width")?.Value<string>();
            var raw_ovr_order         = json.GetValue("order")?.Value<string>();
            var raw_ovr_thumbnailmode = json.GetValue("thumbnailmode")?.Value<string>();
            var raw_ovr_videomode     = json.GetValue("videomode")?.Value<string>();

            var ovr_display       = (raw_ovr_display       == null) ? (int?) null : Arguments.ParseDisplayMode(raw_ovr_display);
            var ovr_width         = (raw_ovr_width         == null) ? (int?) null : Arguments.ParseWidthMode(raw_ovr_width); 
            var ovr_order         = (raw_ovr_order         == null) ? (int?) null : Arguments.ParseOrderMode(raw_ovr_order); 
            var ovr_thumbnailmode = (raw_ovr_thumbnailmode == null) ? (int?) null : Arguments.ParseThumbnailMode(raw_ovr_thumbnailmode); 
            var ovr_videomode     = (raw_ovr_videomode     == null) ? (int?) null : Arguments.ParseVideoMode(raw_ovr_videomode); 
            
            var ovr_theme = json.GetValue("theme")?.Value<string>();

            var raw_d_display       = json.GetValue("display_disabled"      )?.Values<JValue>()?.Select(p => p.Value?.ToString())?.Where(p => p != null)?.ToList() ?? new List<string>();
            var raw_d_width         = json.GetValue("width_disabled"        )?.Values<JValue>()?.Select(p => p.Value?.ToString())?.Where(p => p != null)?.ToList() ?? new List<string>();
            var raw_d_order         = json.GetValue("order_disabled"        )?.Values<JValue>()?.Select(p => p.Value?.ToString())?.Where(p => p != null)?.ToList() ?? new List<string>();
            var raw_d_thumbnailmode = json.GetValue("thumbnailmode_disabled")?.Values<JValue>()?.Select(p => p.Value?.ToString())?.Where(p => p != null)?.ToList() ?? new List<string>();
            var raw_d_videomode     = json.GetValue("videomode_disabled"    )?.Values<JValue>()?.Select(p => p.Value?.ToString())?.Where(p => p != null)?.ToList() ?? new List<string>();
            var raw_d_theme         = json.GetValue("theme_disabled")?.Values<string>()?.ToList() ?? new List<string>();

            var d_display       = raw_d_display.Select(Arguments.ParseDisplayMode);
            var d_width         = raw_d_width.Select(Arguments.ParseWidthMode);
            var d_order         = raw_d_order.Select(Arguments.ParseOrderMode);
            var d_thumbnailmode = raw_d_thumbnailmode.Select(Arguments.ParseThumbnailMode);
            var d_videomode     = raw_d_videomode.Select(Arguments.ParseVideoMode);
            var d_theme         = raw_d_theme.Select(Arguments.ParseThemeName).Select(p => p.ToLower());
            
            var htmltitle = json.GetValue("htmltitle")?.Value<string>()?.Replace("{version}", Program.Version);

            return new DataDirSpec(
                index, spec, path, name, 
                useFilename, recDepth, filter, order, updateorderfile, htmltitle, 
                ovr_display, ovr_width, ovr_order, ovr_videomode, ovr_thumbnailmode, ovr_theme,
                d_display, d_width, d_order, d_videomode, d_thumbnailmode, d_theme);
        }

        public static DataDirSpec FromPath(int index, string dir)
        {
            return new DataDirSpec(
                index, dir, dir, dir, 
                false, 0, "*", null, false, null, 
                null, null, null, null, null, null, 
                Enumerable.Empty<int>(), Enumerable.Empty<int>(), Enumerable.Empty<int>(), Enumerable.Empty<int>(), Enumerable.Empty<int>(), Enumerable.Empty<string>());
        }
    }
}