using System;

namespace youtube_dl_viewer.Jobs
{
    public class JobProxy<T> : IJobProxy, IDisposable where T : Job
    {
        public T Job;

        public bool Killed => Job == null;
        public bool JobRunningOrWaiting => !Killed && (Job.State == JobState.Waiting || Job.State == JobState.Running);

        private JobProxy(T job)
        {
            Job = job;
        }

        public static JobProxy<T> Create(T job) // Only call me in lock(LockConverter)
        {
            return job.AddProxy(new JobProxy<T>(job));
        }

        public void Dispose()
        {
            Job.UnregisterProxy(this);
            Job = null;
        }

        public void Kill()
        {
            Job = null;
        }
    }
}