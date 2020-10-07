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
        
        private readonly List<OrderEntry> _data = new List<OrderEntry>();
        
        private readonly List<OrderEntry> _newdata = new List<OrderEntry>();

        private readonly string _filepath;
        private readonly bool _updateFile;
        
        private OrderingList(string filepath, bool shouldUpdate)
        {
            _filepath   = filepath;
            _updateFile = shouldUpdate;
        }

        public bool IsUpdated => _newdata.Any();

        public static OrderingList ParseFromFile(string filepath, bool shouldUpdate)
        {
            var ol = new OrderingList(filepath, shouldUpdate);
            
            var ln = 0;
            foreach (var line in File.ReadLines(filepath))
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
            if (ekey == null || id == null) d = new OrderEntry(OrderEntry.EKEY_FILENAME, filename1, $"{DateTime.Now:yyyy-MM-dd HH:mm}", title);
            else                            d = new OrderEntry(ekey,                     id,        $"{DateTime.Now:yyyy-MM-dd HH:mm}", $"{title} ({filename1})");

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
            
            File.AppendAllLines(_filepath, _newdata.Select(p => p.AsLine()));
            
            Console.Out.WriteLine($"New Orderfile written to '{_filepath}'");
        }
    }
}