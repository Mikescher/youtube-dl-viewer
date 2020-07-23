using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer.Jobs
{
    public enum JobState
    {
        Waiting  = 0, // just created or in queue
        Running  = 1, // working
        Finished = 2, // work finished (success) ... waiting for proxies
        Success  = 3, // Job done (success)
        Aborted  = 4, // Job aborted
        Failed   = 5, // Job failed
    }
    
    public abstract class Job
    {
        public readonly string Source;
        
        protected readonly List<IJobProxy> Proxies = new List<IJobProxy>();
        protected volatile Thread Thread;

        public int ProxyCount { get { lock (SuperLock) { return Proxies.Count; } } }

        public volatile bool AbortRequest = false;
        public volatile JobState State = JobState.Waiting;
        
        protected object SuperLock => _manager.LockObject;
        
        public abstract string Name { get; }

        private readonly AbsJobManager _manager;
        
        protected Job(AbsJobManager man,string source)
        {
            Source = source;
            _manager = man;
        }

        public void Start()
        {
            Thread = new Thread(JobRun);
            Thread.Start();
        }

        private void JobRun()
        {
            try
            {
                var sw = Stopwatch.StartNew();

                ChangeState(JobState.Running);
                Run();
                if (State == JobState.Running)  throw new Exception("Job still running after Method Exit");
                if (State == JobState.Finished) throw new Exception("Job still running after Method Exit");
                if (State == JobState.Waiting)  throw new Exception("Job still running after Method Exit");

                Console.Out.WriteLine($"Job [{Name}] finished after {(sw.Elapsed):g}");
            }
            catch (Exception e)
            {
                ChangeState(JobState.Failed);
                Console.Error.WriteLine("Error in Job:");
                Console.Error.WriteLine(e);
            }
            finally
            {
                Unregister();
                KillProxies();
                
                GC.Collect(); // ?!?
            }
        }

        protected void ChangeState(JobState newstate)
        {
            if (State == newstate) return;
            
            Console.Out.WriteLine($"Change State of Job [{Name}] '{State}' -> '{newstate}'");
            
            State = newstate;
        }
        
        protected void KillProxies()
        {
            lock (SuperLock)
            {
                if (!Proxies.Any()) return;
                
                Console.Out.WriteLine($"Manually detach {Proxies.Count} proxies from Job [{Name}]");
                        
                foreach (var proxy in Proxies) proxy.Kill();
                Proxies.Clear();
            }
        }

        public void Unregister()
        {
            _manager.Unregister(this);
        }

        public virtual void Abort()
        {
            Console.Out.WriteLine($"Abort Job [{Name}] forcefully");
            
            AbortRequest = true;
            
            Unregister();
            KillProxies();
        }
        
        public JobProxy<T> AddProxy<T>(JobProxy<T> proxy) where T : Job // Only call me in lock(...)
        {
            Proxies.Add(proxy);
            return proxy;
        }

        public void UnregisterProxy(IJobProxy proxy)
        {
            lock (SuperLock)
            {
                Console.Out.WriteLine($"Detach proxy from Job [{Name}] ({ProxyCount - 1} attached proxies)");
                Proxies.Remove(proxy);
            }
        }
        
        protected abstract void Run();

        public virtual JObject AsJson()
        {
            return new JObject
            (
                new JProperty("Name", Name),
                new JProperty("ProxyCount", ProxyCount),
                new JProperty("State", State),
                new JProperty("AbortRequest", AbortRequest),
                new JProperty("Source", Source),
                new JProperty("Thread", new JObject
                (
                    new JProperty("IsNull", Thread == null),
                    new JProperty("Priority", Thread?.Priority),
                    new JProperty("IsAlive", Thread?.IsAlive),
                    new JProperty("IsBackground", Thread?.IsBackground),
                    new JProperty("State", Thread?.ThreadState)
                ))
            );
        }
    }
}