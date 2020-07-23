using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer.Jobs
{
    public class JobManager<T> : AbsJobManager where T : Job
    {
        private readonly List<T>  _queuedJobs   = new List<T>();
        private readonly List<T>  _activeJobs   = new List<T>();
        private readonly List<T>  _finishedJobs = new List<T>();

        public override int CountActive { get { lock (LockObject) { return _activeJobs.Count; } } }
        public override int CountQueued { get { lock (LockObject) { return _queuedJobs.Count; } } }
        public override int CountFinished { get { lock (LockObject) { return _finishedJobs.Count; } } }
        public string RunningCountStr => (MaxParallelism == int.MaxValue) ? _activeJobs.Count.ToString() : $"{_activeJobs.Count}/{MaxParallelism}";
        
        public JobManager(string name, int maxParallelism) : base(maxParallelism, name)
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
                    _queuedJobs.Add(newjob);
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

                _finishedJobs.Add(job);
                while (_finishedJobs.Count > MAX_FINISHED_SIZE) _finishedJobs.RemoveAt(0);
                
                while (_activeJobs.Count < MaxParallelism && _queuedJobs.Any())
                {
                    var qjob = _queuedJobs[0];
                    _queuedJobs.RemoveAt(0);
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

        public override JObject ObjectAsJson()
        {
            lock (LockObject)
            {
                return new JObject
                (
                    new JProperty("Name", Name),
                    new JProperty("MaxParallelism", MaxParallelism),
                    new JProperty("CountActive", _activeJobs.Count),
                    new JProperty("CountQueued", _queuedJobs.Count),
                    new JProperty("CountFinished", _finishedJobs.Count)
                );
            }
        }

        public override IEnumerable<JObject> ListJobsAsJson()
        {
            lock (LockObject)
            {
                return _activeJobs.Select(p => p.AsJson(Name, "Active"))
                    .Concat(_queuedJobs.Select(p => p.AsJson(Name, "Queued")))
                    .Concat(_finishedJobs.Select(p => p.AsJson(Name, "Finished")))
                    .ToList();
            }
            
        }

        public override bool AbortJob(string jobid)
        {
            lock (LockObject)
            {
                foreach (var job in _queuedJobs)   if (job.ID == jobid) { job.PreAbort(); return true; }
                foreach (var job in _activeJobs)   if (job.ID == jobid) { job.Abort(); return true; }
                foreach (var job in _finishedJobs) if (job.ID == jobid) return true;
            }

            return false;
        }
    }
}