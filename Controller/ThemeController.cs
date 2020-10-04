using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace youtube_dl_viewer.Controller
{
    public static class ThemeController
    {
        public static async Task GetTheme(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);

            var theme = Program.Args.Themes.FirstOrDefault(p => p.Index == idx);
            if (theme == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("Theme not found"); return; }

            var css = theme.ReadCSS();
            if (css == null) { context.Response.StatusCode = 404; await context.Response.WriteAsync("CSS not found"); return; }
            
            context.Response.Headers.Add(HeaderNames.ContentType, "text/css");
            await context.Response.WriteAsync(css);
        }
    }
}