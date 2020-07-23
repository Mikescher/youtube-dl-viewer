using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace youtube_dl_viewer.Jobs
{
    [SuppressMessage("ReSharper", "InconsistentlySynchronizedField")]
    public static class JobRegistry
    {
        public static readonly JobManager<ConvertJob>    ConvertJobs      = new JobManager<ConvertJob>(Program.MaxParallelConvertJobs);
        public static readonly JobManager<PreviewGenJob> PreviewGenJobs   = new JobManager<PreviewGenJob>(Program.MaxParallelGenPreviewJobs);
        public static readonly JobManager<DataCollectJob> DataCollectJobs = new JobManager<DataCollectJob>(int.MaxValue);

        public static IEnumerable<AbsJobManager> Managers => new AbsJobManager[]
        {
            ConvertJobs,
            PreviewGenJobs,
            DataCollectJobs,
        };
    }
}