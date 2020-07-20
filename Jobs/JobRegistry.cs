using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace youtube_dl_viewer.Jobs
{
    public class JobRegistry
    {
        public static readonly object LockConverter = new object();
        private static readonly List<ConvertJob> convertJobs = new List<ConvertJob>();

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

        public static void UnregisterConvertJob(ConvertJob job) // Only call me in lock(LockConverter)
        {
            convertJobs.Remove(job);
        }
    }
}