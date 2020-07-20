namespace youtube_dl_viewer.Jobs
{
    public abstract class AbsJobManager
    {
        public int MaxParallelism;
        
        public readonly object LockObject = new object();

        protected AbsJobManager(int maxParallelism)
        {
            MaxParallelism = maxParallelism;
        }

        public abstract void Unregister(Job job);
    }
}