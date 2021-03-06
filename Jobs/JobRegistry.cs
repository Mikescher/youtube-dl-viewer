﻿using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

namespace youtube_dl_viewer.Jobs
{
    [SuppressMessage("ReSharper", "InconsistentlySynchronizedField")]
    public static class JobRegistry
    {
        public static readonly JobManager<ConvertJob>      ConvertJobs     = new JobManager<ConvertJob>(     "Convert",     Program.Args.MaxParallelConvertJobs);
        public static readonly JobManager<PreviewGenJob>   PreviewGenJobs  = new JobManager<PreviewGenJob>(  "PreviewGen",  Program.Args.MaxParallelGenPreviewJobs);
        public static readonly JobManager<DataCollectJob>  DataCollectJobs = new JobManager<DataCollectJob>( "DataCollect", int.MaxValue);
        public static readonly JobManager<ThumbnailGenJob> ThumbGenJobs    = new JobManager<ThumbnailGenJob>("ThumbGen",    Program.Args.MaxParallelGenThumbnailJobs);

        public static IEnumerable<AbsJobManager> Managers => new AbsJobManager[]
        {
            ConvertJobs,
            PreviewGenJobs,
            DataCollectJobs,
            ThumbGenJobs,
        };
    }
}