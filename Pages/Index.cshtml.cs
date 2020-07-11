using System;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace youtube_dl_viewer.Pages
{
    public class IndexModel : PageModel
    {
        public string BaseDir => Program.DataDir;
        public string Version => "0.1";

        /*
         * [0] ListStyle: Grid
         * [1] ListStyle: Compact
         * [2] ListStyle: Tabular
         * [3] ListStyle: Detailed
         */
        public int OptDisplayMode = 0;

        /*
         * [0] Width: Small
         * [1] Width: Medium
         * [2] Width: Wide
         * [3] Width: Full
         */
        public int OptWidthMode = 2;

        /*
         * [0] Sorting: Date [descending]
         * [1] Sorting: Date [ascending]
         * [2] Sorting: Title
         * [3] Sorting: Category
         * [4] Sorting: Views
         * [5] Sorting: Rating
         * [6] Sorting: Uploader
         */
        public int OptOrderMode = 0;

        /*
         * [0] Thumbnails: Off
         * [1] Thumbnails: On (intelligent)
         * [2] Thumbnails: On (sequential)
         * [3] Thumbnails: On (parallel)
         */
        public int OptThumbnailMode = 1;

        /*
         * [0] Playback: Disabled
         * [1] Playback: Seekable raw file
         * [2] Playback: Raw file
         * [3] Playback: Transcoded Webm stream
         * [4] Playback: Download file
         */
        public int OptVideoMode = 4;
        
        public void OnGet()
        {
            
        }
    }
}