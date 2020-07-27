using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace youtube_dl_viewer.Jobs
{
    public abstract class AbsJobManager
    {
        public const int MAX_FINISHED_SIZE = 256;
        
        public int MaxParallelism;
        
        public string Name;
        
        public readonly object LockObject = new object();

        public abstract int CountActive { get; }
        public abstract int CountQueued { get; }
        public abstract int CountFinished { get; }

        protected AbsJobManager(int maxParallelism, string name)
        {
            MaxParallelism = maxParallelism;
            Name = name;
        }

        public abstract void Unregister(Job job);

        public abstract JObject ObjectAsJson();
        
        public abstract IEnumerable<JObject> ListJobsAsJson();

        public abstract bool AbortJob(string jobid);

        public abstract void ClearFinishedJobs();
        
        public abstract int AbortAllJobs();
    }
}