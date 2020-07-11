using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace youtube_dl_viewer.Pages
{
    public class IndexModel : PageModel
    {
        public List<string> BaseDirs => Program.DataDirs;
        public string Version => "0.1";
        public int OptDisplayMode   => Program.OptDisplayMode;
        public int OptWidthMode     => Program.OptWidthMode;
        public int OptOrderMode     => Program.OptOrderMode;
        public int OptThumbnailMode => Program.OptThumbnailMode;
        public int OptVideoMode     => Program.OptVideoMode;
    }
}