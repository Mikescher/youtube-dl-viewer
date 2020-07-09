using System;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace youtube_dl_viewer.Pages
{
    public class IndexModel : PageModel
    {
        public string BaseDir => Program.DataDir;
        public string RawData => Program.DataJSON;
        public string Version => "0.1";
        
        public void OnGet()
        {
            
        }
    }
}