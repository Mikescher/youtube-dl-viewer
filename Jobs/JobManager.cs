using System;
using System.Collections.Generic;
using System.Linq;

namespace youtube_dl_viewer.Jobs
{
    public class JobManager<T> : AbsJobManager where T : Job
    {
        private readonly Stack<T> _queuedJobs = new Stack<T>();
        private readonly List<T>  _activeJobs = new List<T>();

        public JobManager(int maxParallelism) : base(maxParallelism)
        {
        }
        
        public JobProxy<T> StartOrQueue(string src, Func<AbsJobManager, T> ctr, bool attach = true)
        {
            lock (LockObject)
            {
                foreach (var cjob in _activeJobs)
                {
                    if (cjob.Source == src)
                    {
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return attach ? JobProxy<T>.Create(cjob) : null;
                    }
                }
                foreach (var cjob in _queuedJobs)
                {
                    if (cjob.Source == src)
                    {
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return attach ? JobProxy<T>.Create(cjob) : null;
                    }
                }

                var job = ctr(this);

                if (_activeJobs.Count < MaxParallelism)
                {
                    Console.Out.WriteLine($"Start new Job [{job.Name}] (direct)");
                    _activeJobs.Add(job);
                    job.Start();
                    return attach ? JobProxy<T>.Create(job) : null;
                }
                else
                {
                    Console.Out.WriteLine($"Enqueue new Job [{job.Name}] ({_queuedJobs.Count} jobs in queue) ({_activeJobs.Count}/{MaxParallelism} jobs running)");
                    _queuedJobs.Push(job);
                    return attach ? JobProxy<T>.Create(job) : null;
                }
            }
        }

        private void UnregisterJob(T job)
        {
            lock (LockObject)
            {
                var ok = _activeJobs.Remove(job);
                Console.Out.WriteLine($"Unregistered Job [{job.Name}] (change={ok}) ({_queuedJobs.Count} jobs in queue) ({_activeJobs.Count}/{MaxParallelism} jobs running)");

                while (_activeJobs.Count < MaxParallelism && _queuedJobs.Any())
                {
                    var qjob = _queuedJobs.Pop();
                    Console.Out.WriteLine($"Start new Job [{qjob.Name}] (from queue) ({qjob.ProxyCount} attached proxies) ({_queuedJobs.Count} jobs in queue) ({_activeJobs.Count}/{MaxParallelism} jobs running)");
                    qjob.Start();
                    _activeJobs.Add(qjob);
                }
            }
        }

        public override void Unregister(Job job)
        {
            UnregisterJob((T)job);
        }
    }
}