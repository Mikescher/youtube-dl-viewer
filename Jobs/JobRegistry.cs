using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;

namespace youtube_dl_viewer.Jobs
{
    [SuppressMessage("ReSharper", "InconsistentlySynchronizedField")]
    public static class JobRegistry
    {
        private const int MAX_PARALLEL_PREVIEWGEN_JOBS = 6;
        
        public static readonly object LockConverter = new object();
        private static readonly List<ConvertJob> convertJobs = new List<ConvertJob>();
        
        public static readonly object LockPreviewGen = new object();
        private static readonly Stack<PreviewGenJob> previewGenJobsQueue = new Stack<PreviewGenJob>();
        private static readonly List<PreviewGenJob> previewGenJobs = new List<PreviewGenJob>();

        public static JobProxy<ConvertJob> GetOrStartConvertJob(string src, string dst)
        {
            lock (LockConverter)
            {
                foreach (var cjob in convertJobs.Where(p => p.Running))
                {
                    if (cjob.Source == src)
                    {
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return JobProxy<ConvertJob>.Create(cjob);
                    }
                }

                var job = new ConvertJob(src, dst);
                Console.Out.WriteLine($"Start new Job [{job.Name}]");
                convertJobs.Add(job);
                job.Start();
                return JobProxy<ConvertJob>.Create(job);
            }
        }

        public static JobProxy<PreviewGenJob> GetOrQueuePreviewGenJob(string src, string dst)
        {
            lock (LockPreviewGen)
            {
                foreach (var cjob in previewGenJobs.Where(p => p.Running))
                {
                    if (cjob.Source == src)
                    {
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return JobProxy<PreviewGenJob>.Create(cjob);
                    }
                }
                foreach (var cjob in previewGenJobsQueue)
                {
                    if (cjob.Source == src)
                    {
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return JobProxy<PreviewGenJob>.Create(cjob);
                    }
                }

                var job = new PreviewGenJob(src, dst);

                if (previewGenJobs.Count < MAX_PARALLEL_PREVIEWGEN_JOBS)
                {
                    Console.Out.WriteLine($"Start new Job [{job.Name}] (direct)");
                    previewGenJobs.Add(job);
                    job.Start();
                    return JobProxy<PreviewGenJob>.Create(job);
                }
                else
                {
                    Console.Out.WriteLine($"Enqueue new Job [{job.Name}]");
                    previewGenJobsQueue.Push(job);
                    return JobProxy<PreviewGenJob>.Create(job);
                }
            }
        }

        public static void UnregisterConvertJob(ConvertJob job) // Only call me in lock(LockConverter)
        {
            convertJobs.Remove(job);
        }
        
        public static void UnregisterGenPreviewJob(PreviewGenJob job) // Only call me in lock(LockPreviewGen)
        {
            previewGenJobs.Remove(job);

            while (previewGenJobs.Count < MAX_PARALLEL_PREVIEWGEN_JOBS && previewGenJobsQueue.Any())
            {
                var qjob = previewGenJobsQueue.Pop();
                Console.Out.WriteLine($"Start new Job [{qjob.Name}] (from queue) ({qjob.ProxyCount} attached proxies)");
                qjob.Start();
                previewGenJobs.Add(job);
            }
        }
    }
}