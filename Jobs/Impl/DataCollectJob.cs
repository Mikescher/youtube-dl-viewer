using System;
using System.Threading;
using Newtonsoft.Json.Linq;
using youtube_dl_viewer.Model;

namespace youtube_dl_viewer.Jobs
{
    public class DataCollectJob : Job
    {
        public readonly int Index;
        public readonly bool ClearOld;
        
        public string Result = null;
        public DataDirData FullResult = null;
        
        private (int, int) _progress = (0, 1);
        public override (int, int) Progress => _progress;

        public DataCollectJob(AbsJobManager man, int index, bool clearOld) : base(man, "self::"+index)
        {
            Index    = index;
            ClearOld = clearOld;
        }

        public override string Name => $"DataCollect::{Index}::'{((Index>=0 && Index <= Program.Args.DataDirs.Count) ? Program.Args.DataDirs[Index].Name : "ERR")}'";

        public override void Abort()
        {
            Console.Error.WriteLine($"Cannot abort Job [{Name}]");
        }

        protected override void Run()
        {
            if (ClearOld)
            {
                lock (Program.DataCache) Program.DataCache[Index] = null;
            }
            
            var reader = new DataDirReader(Index, Program.Args.DataDirs[Index]);
            reader.Init();
            var dat = reader.List((p, m) => _progress = (p, m));
            
            lock (Program.DataCache)
            {
                Program.DataRefreshTimestamps[Index] = DateTime.Now;
                Program.DataCache[Index] = dat;
                Result = dat.JsonString;
                FullResult = dat;
            }
            
            _progress = (1, 1);

            ChangeState(JobState.Finished);
            
            while (ProxyCount != 0) // Wait for proxies
            {
                if (AbortRequest) { ChangeState(JobState.Aborted); return; }
                        
                Thread.Sleep(100);
            }
            
            ChangeState(JobState.Success);

            Result     = null; // Memory cleanup
            FullResult = null;
        }
        
        public override JObject AsJson(string managerName, string queue)
        {
            var obj = base.AsJson(managerName, queue);
            obj.Add(new JProperty("Index", Index));
            return obj;
        }
    }
}