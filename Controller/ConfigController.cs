using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Config;

namespace youtube_dl_viewer.Controller
{
    public static class ConfigController
    {
        public static async Task ListConfig(HttpContext context)
        {
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");

            var r = new JObject
            (
                new JProperty("commandline", Environment.CommandLine),
                new JProperty("configfilecontent", Program.Args.ExtConfigContent),
                new JProperty("raw", ListRawConfigValues().ToArray<object>()),
                new JProperty("config", ListNormalConfigValues().ToArray<object>()),
                new JProperty("datadirs", ListDataDirs().ToArray<object>()),
                new JProperty("userthemes", ListUserThemes().ToArray<object>())
            );
            
            await context.Response.WriteAsync(r.ToString(Program.DEBUG ? Formatting.Indented : Formatting.None));
        }

        private static IEnumerable<JObject> ListRawConfigValues()
        {
            return Program.Args.RawArgumentValues.Select(p => new JObject(new JProperty("key", p.Item1), new JProperty("value", p.Item2)));
        }
        
        private static IEnumerable<JObject> ListNormalConfigValues()
        {
            var props = typeof(Arguments).GetFields()
                .Select(p => (p, p.GetCustomAttributes(typeof(ConfigAttribute), true).Cast<ConfigAttribute>().FirstOrDefault()))
                .Where(p => p.Item2 != null);

            var args = Program.Args;
            var def  = new Arguments();
            
            foreach (var (field, attr) in props)
            {
                var valueCurr = field.GetValue(args);
                var valueOrig = field.GetValue(def);
                
                yield return new JObject
                (
                    (new JProperty("key", attr.Keys.First())),
                    (new JProperty("changed", !object.Equals(valueCurr, valueOrig))),
                    (new JProperty("provided", attr.Keys.Any(k => args.RawArgumentValues.Any(v => string.Equals(v.Item1, k, StringComparison.CurrentCultureIgnoreCase))))),
                    (new JProperty("value_current_raw", valueCurr)),
                    (new JProperty("value_original_raw", valueOrig)),                   
                    (new JProperty("value_current_fmt", attr.FormatValue(valueCurr))),
                    (new JProperty("value_original_fmt", attr.FormatValue(valueOrig)))
                );
            }
        }

        private static IEnumerable<JObject> ListUserThemes()
        {
            foreach (var ut in Program.Args.Themes.Where(p => p.FullPath != null))
            {
                yield return new JObject
                (
                    new JProperty("index",       ut.Index),
                    new JProperty("name",        ut.Name),
                    new JProperty("filename",    ut.Filename),
                    new JProperty("fullpath",    ut.FullPath),
                    new JProperty("selector_id", ut.SelectorID),
                    new JProperty("uri",         ut.URI),
                    new JProperty("css",         ut.ReadCSS(null))
                );
            }
        }

        private static IEnumerable<JObject> ListDataDirs()
        {
            int idx = 0;
            foreach (var ddir in Program.Args.DataDirs)
            {
                yield return new JObject
                (
                    new JProperty("index",               idx),
                    new JProperty("index2",              ddir.Index),
                    new JProperty("spec",                ddir.InputSpec),
                    new JProperty("selector_id",         ddir.SelectorID),
                    new JProperty("full_order_filename", ddir.FullOrderFilename),
                    
                    new JProperty("values", new JArray
                    (
                        new JObject(new JProperty("key", "name"),                  new JProperty("value", ddir.Name),                  new JProperty("changed", ddir.Name                  != null)),
                        new JObject(new JProperty("key", "path"),                  new JProperty("value", ddir.Path),                  new JProperty("changed", ddir.Path                  != null)),
                        new JObject(new JProperty("key", "use_filename_as_title"), new JProperty("value", ddir.UseFilenameAsTitle),    new JProperty("changed", ddir.UseFilenameAsTitle    != false)),
                        new JObject(new JProperty("key", "recursion"),             new JProperty("value", ddir.RecursionDepth),        new JProperty("changed", ddir.RecursionDepth        != 0)),
                        new JObject(new JProperty("key", "filter"),                new JProperty("value", ddir.FilenameFilter),        new JProperty("changed", ddir.FilenameFilter        != "*")),
                        new JObject(new JProperty("key", "ext_order"),             new JProperty("value", ddir.OrderFilename),         new JProperty("changed", ddir.OrderFilename         != null)),
                        new JObject(new JProperty("key", "update_ext_order"),      new JProperty("value", ddir.UpdateOrderFile),       new JProperty("changed", ddir.UpdateOrderFile       != true)),
                        
                        new JObject(new JProperty("key", "display"),               new JProperty("value", ddir.DisplayOverride),       new JProperty("changed", ddir.DisplayOverride       != null), new JProperty("enum_display_value", new JArray("grid", "compact", "tabular", "detailed", "gridx2", "grid_half", "timeline"))),
                        new JObject(new JProperty("key", "width"),                 new JProperty("value", ddir.WidthOverride),         new JProperty("changed", ddir.WidthOverride         != null), new JProperty("enum_display_value", new JArray("small", "medium", "wide", "full"))),
                        new JObject(new JProperty("key", "order"),                 new JProperty("value", ddir.OrderOverride),         new JProperty("changed", ddir.OrderOverride         != null), new JProperty("enum_display_value", new JArray("date-desc", "date-asc", "title", "category", "views", "rating", "uploader", "external-desc", "external-asc", "random", "filename-asc", "filename-desc"))),
                        new JObject(new JProperty("key", "thumbnailmode"),         new JProperty("value", ddir.ThumbnailmodeOverride), new JProperty("changed", ddir.ThumbnailmodeOverride != null), new JProperty("enum_display_value", new JArray("off", "intelligent", "sequential", "parallel"))),
                        new JObject(new JProperty("key", "videomode"),             new JProperty("value", ddir.VideomodeOverride),     new JProperty("changed", ddir.VideomodeOverride     != null), new JProperty("enum_display_value", new JArray("disabled", "raw-seekable", "raw", "transcoded", "download", "vlc-stream", "vlc-local", "url"))),
                        
                        new JObject(new JProperty("key", "theme"),                 new JProperty("value", ddir.ThemeOverride),         new JProperty("changed", ddir.ThemeOverride         != null)),
                        
                        new JObject(new JProperty("key", "htmltitle"),             new JProperty("value", ddir.HTMLTitle),             new JProperty("changed", ddir.HTMLTitle             != null))
                    ))
                );
                idx++;
            }
        }
    }
}