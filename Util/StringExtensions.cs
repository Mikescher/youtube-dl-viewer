using System;
using System.Security.Cryptography;
using System.Text;

namespace youtube_dl_viewer.Util
{
    public static class StringExtensions
    {
        public static string Sha256(this string v)
        {
            using var sha = new SHA256Managed();
            
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(v));
                
            var sb = new StringBuilder(hash.Length * 2);
            foreach (var b in hash) sb.Append(b.ToString("X2"));
            return sb.ToString();
        }
        
        public static bool EqualsIgnoreCase(this string v, string other)
        {
            if ((v == null) != (other == null)) return false;
            if (v == null) return true;
            return v.Equals(other, StringComparison.InvariantCultureIgnoreCase);
        }
    }
}