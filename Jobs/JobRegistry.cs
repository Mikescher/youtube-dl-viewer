using System.Diagnostics.CodeAnalysis;

namespace youtube_dl_viewer.Jobs
{
    [SuppressMessage("ReSharper", "InconsistentlySynchronizedField")]
    public static class JobRegistry
    {
        public static readonly JobManager<ConvertJob>    ConvertJobs    = new JobManager<ConvertJob>(Program.MaxParallelConvertJobs);
        public static readonly JobManager<PreviewGenJob> PreviewGenJobs = new JobManager<PreviewGenJob>(Program.MaxParallelGenPreviewJobs);
    }
}