using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using youtube_dl_viewer.Util;

namespace youtube_dl_viewer.Config
{
    public class OrderingList
    {
        private static readonly Regex REX_LINE = new Regex(@"^(?<extractor>[A-Za-z0-9_]+)\s+(?<id>.+?)(?:\s+(?:\[(?<date>[0-9\-: ]+)\]\s*)?(?://\s*(?<comment>.*?)\s*)?)?\s*$"); 
        
        private List<string> _sourceLines;
        
        private readonly List<OrderEntry> _data = new List<OrderEntry>();
        
        private readonly List<OrderEntry> _newdata = new List<OrderEntry>();

        private readonly string _filepath;
        private readonly bool _updateFile;
        
        private OrderingList(string filepath, bool shouldUpdate, List<string> lines)
        {
            _sourceLines = lines;
            _filepath    = filepath;
            _updateFile  = shouldUpdate;
        }

        public bool IsUpdated => _newdata.Any();

        public static OrderingList ParseFromFile(string filepath, bool shouldUpdate)
        {
            var lines = File.ReadLines(filepath).ToList();
            
            var ol = new OrderingList(filepath, shouldUpdate, lines);
            
            var ln = 0;
            foreach (var line in lines)
            {
                ln++;
                
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (line.Trim().StartsWith("#")) continue;
                if (line.Trim().StartsWith("//")) continue;

                var match = REX_LINE.Match(line);
                if (!match.Success) throw new Exception($"Could nat parse order file '{filepath}'. Invalid data in line {ln}.");

                var extractor = match.Groups["extractor"].Value;
                var id        = match.Groups["id"].Value;
                var date      = match.Groups["date"].Value;
                var comment   = match.Groups["comment"].Value;
                
                ol._data.Add(new OrderEntry(extractor, id, date, comment));
            }

            return ol;
        }

        public int? GetOrderingOrInsert(string path, string ekey, string id, string title)
        {
            var sha256    = path.Sha256();
            var filename1 = Path.GetFileName(path);
            var filename2 = Path.GetFileNameWithoutExtension(path);
            
            int? result = null;
            for (int i = 0; i < _data.Count; i++)
            {
                if (_data[i].IsMatch(sha256, filename1, filename2, ekey, id))
                {
                    if (result != null) Console.Error.WriteLine($"For the file '{path}' exit multiple matching lines ({result} & {i}) in the ext_order file");
                    result = i;
                }
            }

            if (result != null) return result;
            
            OrderEntry d;
            if ((ekey == null || id == null) && filename1 != title) 
                d = new OrderEntry(OrderEntry.EKEY_FILENAME, filename1, $"{DateTime.Now:yyyy-MM-dd HH:mm}", $"(auto-add) {title}");
            else if (ekey == null || id == null) 
                d = new OrderEntry(OrderEntry.EKEY_FILENAME, filename1, $"{DateTime.Now:yyyy-MM-dd HH:mm}", $"(auto-add)");
            else
                d = new OrderEntry(ekey,                     id,        $"{DateTime.Now:yyyy-MM-dd HH:mm}", $"(auto-add) {title} ({filename1})");

            var idx = _data.Count;
            _data.Add(d);

            if (_updateFile)
            {
                _newdata.Add(d);
                Console.Out.WriteLine($"Updated Orderfile '{_filepath}': Added [{d.ExtractorKey} {d.ID}] at {idx}");
            }
            
            return idx;
        }

        public void UpdateFile()
        {
            if (!_updateFile) return;
            if (!IsUpdated) return;

            var i1 = _data.Max(p => p.ExtractorKey.Length);
            var i2 = _data.Max(p => p.ID.Length);
            var i3 = _data.Max(p => p.Date.Length) + 2;
            
            var lines = new List<string>();
            foreach (var sln in _sourceLines)
            {
                if (string.IsNullOrWhiteSpace(sln)) { lines.Add(sln); continue; }
                if (sln.Trim().StartsWith("#"))     { lines.Add(sln); continue; }
                if (sln.Trim().StartsWith("//"))    { lines.Add(sln); continue; }
                
                
                var match = REX_LINE.Match(sln);
                if (match.Success)
                {
                    var entry = new OrderEntry(match.Groups["extractor_key"].Value, match.Groups["id"].Value, match.Groups["date"].Value, match.Groups["comment"].Value);
                    lines.Add(entry.AsLine(i1, i2, i3));
                }
                else
                {
                    lines.Add("#(ERR) " + sln);
                }
            }

            foreach (var entry in _newdata) lines.Add(entry.AsLine(i1, i2, i3));

            _sourceLines = lines;
            _newdata.Clear();
            
            File.WriteAllLines(_filepath, lines);
            
            Console.Out.WriteLine($"New Orderfile written to '{_filepath}'");
        }
    }
}