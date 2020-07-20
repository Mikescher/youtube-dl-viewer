using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace youtube_dl_viewer.Controller
{
    public static class DataController
    {
        public static async Task GetData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(Program.Data[idx].json);
        }

        public static async Task RefreshData(HttpContext context)
        {
            var idx = int.Parse((string)context.Request.RouteValues["idx"]);
            
            var json = Program.RefreshData(idx);
            
            context.Response.Headers.Add(HeaderNames.ContentType, "application/json");
            await context.Response.WriteAsync(json);
        }
    }
}