using System;

namespace youtube_dl_viewer.Config
{
    public class OrderEntry
    {
        public const string EKEY_PATHHASH = "filepath";
        public const string EKEY_FILENAME = "filename";
        
        public readonly string ExtractorKey;
        public readonly string ID;
        public readonly string Date;
        public readonly string Comment;

        public OrderEntry(string extractor, string id, string date, string comment)
        {
            ExtractorKey = extractor;
            ID           = id;
            Date         = date;
            Comment      = comment;
        }

        public bool IsMatch(string sha256, string filename1, string filename2, string ekey, string id)
        {
            if (ExtractorKey == EKEY_PATHHASH && string.Equals(ID, sha256,    StringComparison.CurrentCultureIgnoreCase)) return true;
            
            if (ExtractorKey == EKEY_FILENAME && string.Equals(ID, filename1, StringComparison.CurrentCultureIgnoreCase)) return true;
            if (ExtractorKey == EKEY_FILENAME && string.Equals(ID, filename2, StringComparison.CurrentCultureIgnoreCase)) return true;
            
            if (ekey != null && id != null && string.Equals(ExtractorKey, ekey, StringComparison.CurrentCultureIgnoreCase) && string.Equals(ID, id, StringComparison.CurrentCultureIgnoreCase)) return true;

            return false;
        }

        public string AsLine()
        {
            var r = $"{ExtractorKey} {ID}";
            if (!string.IsNullOrWhiteSpace(Date)) r += $" [{Date}]";
            if (!string.IsNullOrWhiteSpace(Comment)) r += $" [{Comment.Replace("\r", "").Replace("\n", "")}]";
            return r;
        }
    }
}