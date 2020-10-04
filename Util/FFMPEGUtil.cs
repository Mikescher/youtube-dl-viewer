using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace youtube_dl_viewer.Util
{
    public static class FFMPEGUtil
    {
        public static (int, string) RunCommand(string cmd, string args, string desc)
        {
            var start = DateTime.Now;
            
            var proc1 = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = cmd,
                    Arguments = args,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };

            var builderOut = new StringBuilder();
            proc1.OutputDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
            proc1.ErrorDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
                
            proc1.Start();
            proc1.BeginOutputReadLine();
            proc1.BeginErrorReadLine();
            proc1.WaitForExit();

            if (Program.Args.FFMPEGDebugDir != null)
            {
                File.WriteAllText(Path.Combine(Program.Args.FFMPEGDebugDir, $"{start:yyyy-MM-dd_HH-mm-ss.fffffff}_[{desc}].log"), $"> {cmd} {args}\nExitCode:{proc1.ExitCode}\nStart:{start:yyyy-MM-dd HH:mm:ss}\nEnd:{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n\n{builderOut}");
            }

            return (proc1.ExitCode, builderOut.ToString());
        }
        
        public static async Task<(int, string)> RunCommandAsync(string cmd, string args, string desc)
        {
            var start = DateTime.Now;
            
            var proc1 = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = cmd,
                    Arguments = args,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };

            var builderOut = new StringBuilder();
            proc1.OutputDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
            proc1.ErrorDataReceived += (sender, oargs) =>
            {
                if (oargs.Data == null) return;
                if (builderOut.Length == 0) builderOut.Append(oargs.Data);
                else builderOut.Append("\n" + oargs.Data);
            };
                
            proc1.Start();
            proc1.BeginOutputReadLine();
            proc1.BeginErrorReadLine();
            await proc1.WaitForExitAsync();

            if (Program.Args.FFMPEGDebugDir != null)
            {
                await File.WriteAllTextAsync(Path.Combine(Program.Args.FFMPEGDebugDir, $"{start:yyyy-MM-dd_HH-mm-ss.fffffff}_[{desc}].log"), $"> {cmd} {args}\nExitCode:{proc1.ExitCode}\nStart:{start:yyyy-MM-dd HH:mm:ss}\nEnd:{DateTime.Now:yyyy-MM-dd HH:mm:ss}\n\n{builderOut}");
            }

            return (proc1.ExitCode, builderOut.ToString());
        }

        public static double ParseDoubleOutput(string dbl, string srccmd)
        {
            try
            {
                return double.Parse(dbl.Trim(), CultureInfo.InvariantCulture);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw new Exception($"Could not parse FFMPEG double '{dbl}' from command '{srccmd}'", e);
            }
        }
    }
}