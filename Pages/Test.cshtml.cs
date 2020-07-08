using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Resources;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace youtube_dl_viewer.Pages
{
    public class Test : PageModel
    {
        public List<string> Data = new List<string>();
        
        public void OnGet()
        {
            Data.Add(string.Join("  +--+  ", Environment.GetCommandLineArgs()));
            
            Data.Add(string.Join(" ; ", Assembly.GetExecutingAssembly().GetManifestResourceNames()));
        }
    }
}