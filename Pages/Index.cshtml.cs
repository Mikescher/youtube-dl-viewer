using System;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace youtube_dl_viewer.Pages
{
    public class IndexModel : PageModel
    {
        public string BaseDir => Program.DataDir;
        public string RawData => Program.data_json;
        
        public void OnGet()
        {
            
        }
    }
}