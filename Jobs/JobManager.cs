using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer.Jobs
{
    public class JobManager<T> : AbsJobManager where T : Job
    {
        private readonly Stack<T> _queuedJobs = new Stack<T>();
        private readonly List<T>  _activeJobs = new List<T>();

        public string RunningCountStr => (MaxParallelism == int.MaxValue) ? _activeJobs.Count.ToString() : $"{_activeJobs.Count}/{MaxParallelism}";
        
        public JobManager(int maxParallelism) : base(maxParallelism)
        {
        }
        
        public JobProxy<T> StartOrQueue(Func<JobManager<T>, T> ctr, bool attach = true)
        {
            var newjob = ctr(this);
            
            lock (LockObject)
            {
                foreach (var cjob in _activeJobs)
                {
                    if (cjob.Source == newjob.Source)
                    {
                        if (!attach) return null;
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return JobProxy<T>.Create(cjob);
                    }
                }
                foreach (var cjob in _queuedJobs)
                {
                    if (cjob.Source == newjob.Source)
                    {
                        if (!attach) return null;
                        Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                        return JobProxy<T>.Create(cjob);
                    }
                }

                if (_activeJobs.Count < MaxParallelism)
                {
                    Console.Out.WriteLine($"Start new Job [{newjob.Name}] (direct)");
                    _activeJobs.Add(newjob);
                    newjob.Start();
                    return attach ? JobProxy<T>.Create(newjob) : null;
                }
                else
                {
                    Console.Out.WriteLine($"Enqueue new Job [{newjob.Name}] ({_queuedJobs.Count} jobs in queue) ({RunningCountStr} jobs running)");
                    _queuedJobs.Push(newjob);
                    return attach ? JobProxy<T>.Create(newjob) : null;
                }
            }
        }

        public JobProxy<T> GetProxyOrNullLockless(Func<JobManager<T>, T> ctr)
        {
            var newjob = ctr(this);
            
            foreach (var cjob in _activeJobs)
            {
                if (cjob.Source == newjob.Source)
                {
                    Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                    return JobProxy<T>.Create(cjob);
                }
            }
            foreach (var cjob in _queuedJobs)
            {
                if (cjob.Source == newjob.Source)
                {
                    Console.Out.WriteLine($"Attach new proxy to Job [{cjob.Name}] ({cjob.ProxyCount + 1} attached proxies)");
                    return JobProxy<T>.Create(cjob);
                }
            }

            return null;
        }

        private void UnregisterJob(T job)
        {
            lock (LockObject)
            {
                var ok = _activeJobs.Remove(job);
                if (!ok) return;
                
                Console.Out.WriteLine($"Unregister Job [{job.Name}] ({_queuedJobs.Count} jobs in queue) ({RunningCountStr} jobs running)");

                while (_activeJobs.Count < MaxParallelism && _queuedJobs.Any())
                {
                    var qjob = _queuedJobs.Pop();
                    Console.Out.WriteLine($"Start new Job [{qjob.Name}] (from queue) ({qjob.ProxyCount} attached proxies) ({_queuedJobs.Count} jobs in queue) ({_activeJobs.Count+1}/{MaxParallelism} jobs running)");
                    qjob.Start();
                    _activeJobs.Add(qjob);
                }
            }
        }

        public override void Unregister(Job job)
        {
            UnregisterJob((T)job);
        }

        public JObject ListAsJson()
        {
            lock (LockObject)
            {
                return new JObject
                (
                    new JProperty("maxParallelism", MaxParallelism),
                    new JProperty("active", new JArray(_activeJobs.Select(p => p.AsJson()))),
                    new JProperty("queued", new JArray(_queuedJobs.Select(p => p.AsJson())))
                );
            }
            
        }
    }
}