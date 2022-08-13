## Introduction

This is a (cross platform, standalone) web app to display videos downloaded by [youtube-dl](https://youtube-dl.org/) (or similiar tools) and view them inside your browser in a nice (youtube-like) UI.

[Download from the github releases section](https://github.com/Mikescher/youtube-dl-viewer/releases/latest)  

[Also available from my personal website](https://www.mikescher.com/programs/view/youtube-dl-viewer)  

## Screenshots

![preview](README_FILES/animation.gif)

## Usage / QuickStart

#### - Local Usage

The easiest way to use is to simply drop the binary in the directory with the video files, run it and open the displayed URL in your browser.  
For a bit more customization you can create a `.bat` or `.sh` wrapper to run it with a few parameter

~~~batch
REM Example:
REM (remove comments before copying)

youtube-dl-viewer.exe                                ^
  --cache="C:\Users\me\AppData\Local\Tempytdl_cache" ^  # specify cache directory for generated thumbnails
  --videomode=vlc-local                              ^  # default to local vlc protocol links for playback
  --open-browser                                        # autom. open browser after startup
~~~

#### - Server Usage

Another use case is to have your video files synchronized to a server and host a permanent instance of youtube-dl-viewer there.  
Then you can either access it directly via the specified port or use [nginx/apache as a reverse proxy](https://httpd.apache.org/docs/2.4/howto/reverse_proxy.html)

~~~bash
#!/bin/bash

DOTNET_BUNDLE_EXTRACT_BASE_DIR=/home/web_aspnet/dot_net_cache/
export DOTNET_BUNDLE_EXTRACT_BASE_DIR

./youtube-dl-viewer --port=9876                                                              \
                    --cache="/media/youtube-dl-viewer_cache/"                                \
                    --display=grid                                                           \
                    --order=date-desc                                                        \
                    --width=medium                                                           \
                    --thumbnailmode=intelligent                                              \
                    --videomode=transcoded                                                   \
                    --path="/media/nextcloud/data/Mikescher/files/Videos/YoutubePlaylist1"   \
                    --path="/media/nextcloud/data/Mikescher/files/Videos/YoutubePlaylist2"   \
                    --path="/media/filecloud/data/Mikescher/files/Videos/YoutubePlaylist3"
~~~

~~~
<VirtualHost *:80>
        ServerName  example.com

        ProxyPreserveHost On
        ProxyRequests off
        ProxyPass        / http://127.0.0.1:9876/
        ProxyPassReverse / http://127.0.0.1:9876/

        ErrorLog /var/log/apache2/error_youtube-dl-viewer.log
        LogLevel warn
        CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
~~~

For synchronization you can use for example nextcloud, but every solution where youtube-dl-viewer can access the raw files on your filesystem works.


#### - youtube-dl

You can use any youtube-dl parameters as you want.  
youtube-dl-viewer will use any data it has, the only necessary file is the actual video. But it will also use and display available metadata (aka `*.info.json`, `*.description` and thumbnails).  

My youtube-dl parameters are these:
~~~
youtube-dl 

--download-archive "{archive_location}"
--output "{ouput_location}\%%(playlist_index)s - %%(title)s.%%(ext)s"

--format "bestvideo+bestaudio/best"

--no-overwrites
--restrict-filenames
--ignore-errors 

--write-description
--write-info-json
--write-annotations
--write-thumbnail
--all-subs

--recode-video mkv


"https://www.youtube.com/{playlist_url}"
~~~

If you start backup from scratch I would recommend to use `--recode-video webm`. webm (or mp4) is by default a format that can be streamed to your browser, this way you can easily watch the directly in your browser.  
Otherwise you can either use the `transcoded webm stream` option, where the video is live transcoded via ffmpeg (needs to be installed), or the VLC protocol link where the file is streamed to your VLC media player


#### - Playback options

youtube-dl-viewer supports playing the videos by clicking on them, there are multiple modes for this available:

 - **Disabled:**  
   Does not play the video. Duh.
 - **Seekable raw file:**  
   Try to play the video in a native browser <media> element. This will only work if the video is already in a supported streamable format, which is (currently) only webm and mp4 (and only mp4's generated with the correct parameters). If the video format is not supported you will get an error message in your browser
 - **Raw file:**  
   This is mostly the same as **Seekable raw file**, with the same limitations. But this one also does not support HTTP range requests, which means you can't easily skip forward in the video.
 - **Transcoded webm stream:**  
   This mode uses a [ffmpeg](https://ffmpeg.org/) to transcode the video file to webm file and stream it to the user.  
   A working ffmpeg installation is required because youtube-dl-viewer will simply call the ffmpeg command. If you do not have (and do not want) a ffmpeg installation you can start youtube-dl-viewer with the command `--no-ffmpeg` to disable all ffmpeg dependent functionality.  
   If you don't want to use the default ffmpeg of your system you can specify an executable with the arguments `--exec-ffmpeg` and `--exec-ffprobe` 
   You can tweak the ffmpeg parameters with the parameter `--webm-convert-params`.  
   Depending on the video, the parameter and you machine ffmpeg may not be able to encode the video fast enough for a smooth playback. To fix this prolem (at least a bit) you can supply youtube-dl-viewer with a `--cache` path where past converted videos will be remembered so that the next time the converted artifacts will be re-used.  
   Also you can limit the maximum amount of parallel ffmpeg conversion jobs with the `--max-parallel-convert` parameter.
 - **Download file:**  
  Simply prompt the user to download the video file.
 - **VLC protocol link (stream):**  
  Opens a `vlc://...` link to the video file. This is useful if your videos are in a format that's generally streamable but simply not supported by your browser (a common example is mkv).  
  Unfortunately vlc is not a protocol that's supported by default so you have to manually register it, an implementation/installation can be found at [stefansundin/vlc-protocol](https://github.com/stefansundin/vlc-protocol/).  
  This option depends on a working `vlc://` protocol and the fact that the video format is supported by [VLC](https://www.videolan.org/vlc/).
 - **VLC protocol link (local):**  
  This is mostly the same as **VLC protocol link (stream)** but it adds the local file path to your VLC playlist and not the video URL.  
  This is preferable if youtube-dl-viewer is running on your machine, because then the VLC Player doesn't have to yo through web requests to get the file and can simply read it from your hard drive, but of course this only works if VLC can access the original video file path (eg if its not running on a server)
 - **Open original Webpage**
  Open the original URL from where the video came in a new tab (normally its youtube).

## Advanced Usage

#### - Multiple Paths

You can supply multiple `--path="{path}"` arguments, the first one will be used by default and you can switch to a different path in the top left area of the website.

#### - Reload

Via the reload button in the top right you can force a re-scan of all the video and metadata on the filesystem, this is usually only done on application startup.

#### - Live transcode with ffmpeg

youtube-dl-viewer can use [ffmpeg](https://ffmpeg.org/) to transcode the video file to a webm file and stream it directly to the user.  
A working ffmpeg installation is required and needs to be accessible. Youtube-dl-viewer will simply call the ffmpeg command with the appropriate parameters.  
Simply select **Transcoded webm stream** in the top right corner as your playback mode to choose this.

If you do not have (and do not want) a ffmpeg installation you can start youtube-dl-viewer with the command `--no-ffmpeg` to disable all ffmpeg dependent functionality.  
You can tweak the ffmpeg parameters with the parameter `--webm-convert-params`, the default values are optimized for fast transcoding, if you want you can change that to a more quality-oriented approach.  
Depending on the video, the parameter and you machine ffmpeg may not be able to encode the video fast enough for a smooth playback.
To fix this prolem (at least a bit) you can supply youtube-dl-viewer with a `--cache` path where past converted videos will be saved.
The next time you want to play that specific video the cached files will be used.  
You can limit the maximum amount of parallel ffmpeg conversion jobs with the `--max-parallel-convert` parameter.

> **[!] Note**   
> If you already have your files in .webm format (or an appropriate .mp4) you can skip all this complexity and simply serve the files directly via the **Seekable raw file** playback mode.  
> And if you only use youtube-dl-viewer on a single computer you control it would also be easier (and yield better results) to install the VLC URL protocol and use that playback mode.  

#### - Generated Thumbnails (ffmpeg)

By default youtube-dl-viewer uses the thumbnails that it finds with the video file (either referenced in the info.json file, or a image file with the same filename as the video).
But if there isn't a suitable thumbnail it uses ffmpeg to generate one from the video file.  
This uses the same behavior as ffmpeg generated previews, we simply generate the preview images (see below) and use the second preview image as our thumbnail.  
For more information see the following section.

This can be deactivated (as all ffmpeg dependent functionality with the `--no-ffmpeg` parameter)

#### - Generated Previews (ffmpeg)

In `Grid` and `Detailed` mode you can hover over a video thumbnail and see an animation consisting of multiple frames from the video.  
These frames are extracted using ffmpeg at regular intervals. Because it can take a few seconds to get the images (depending on your machine and the video) it is recommended to specify a `--cache` directory where the preview files will be cached.  

You can modify this behavior with the following program arguments:
  - `--preview-width`: The width of the generated image files (the height is automatically calculated)
  - `--max-parallel-genprev`: The maximum amount of parallel preview-generation jobs. 
  - `--previewcount-min`: The minimum amount of preview frames per video file (can still be less if the video is too short)
  - `--previewcount-max`: The maximum amount of preview frames per video file
  - `--thumnail-ex-mode`: Choose one of the three ways to extract the frames:
     * `sequential`: **Sequential:** Call ffmpeg multiple times for each frame, one call after the other
     * `parallel`: **Parallel:** Call ffmpeg multiple times for each frame, all calls parallel (can lead to many simultaneous ffmpeg processes)
     * `singlecommand`: **SingleCommand:** Call ffmpeg oce with the appropriate filter arguments, leads to frames that are more precisely positioned (at the exact timestamps), but takes longer.
     
If the video does not have a provided thumbnail the second (!) preview frame is also used as an thumbnail

> **[!] Note**  
> If a cache directory is specified youtube-dl-viewer will try to generate previews for all videos in the background so that for all videos cached previews will exist.  
> To disable this use the `--no-auto-previews` option

This can be deactivated (as all ffmpeg dependent functionality with the `--no-ffmpeg` parameter)

#### - VLC Protocol links

The playback modes **VLC protocol link (stream)** and **VLC protocol link (local)** use "VLC URL protocol" links (`vlc://...`).  
This means they try to launch your locally installed VLC player with a specific URI (either a local file or a streamable link).  
Your client needs to support these links, the easiest way is to use the ready-made scripts from [stefansundin](https://github.com/stefansundin/vlc-protocol).

> **Note for Firefox**  
> If you are often restarting youtube-dl-viewer and everytime use a different (random) port firefox will always warn you with the popup:  
> `Allow this site to open the PROTOCOL link with APPLICATION?`  
> To permanently allow (all) external protocols go to `about:config` and set the value `security.external_protocol_requires_permission` to *false*

#### - Cache directory

As soon as you intend to do anything work intensive (ffmpeg live transcode, generated thumbnails, preview frames) it is **very** recommended to specify a cache directory to cache the results of these jobs.  
Files in the cache directory normally contain the sha256sum of video file path in their filename to identify them (under windows its the relative path to support removable media).  
You can at any time delete some or all files in the cache directory (e.g. only keep the newest x files) and the files will be re-created the next time they are needed.

#### - Thumbnail mode

In the top right corner you can choose the thumbnail loading mode (you can also specify the default as an program argument).

1. **Off**  
Do not load thumbnails (or preview frames)

2. **On (sequential)**  
Load all currently visible thumbnails one after the other

3. **On (parallel)**  
Load all currently visible thumbnails in parallel

4. **On (intelligent)**  
Load the currently visible thumbnails in parallel *and* pre-load non-visible thumbnails sequentially in the background

#### - Extended --path specifications

By specifying one (or more) `--path` arguments you can set the directori(es) where the program looks for video files.  
But instead of a simple directory-path you can also supply a json object in the `--path` argument for more fine-tuning, eg: `--path="{path:'/home/me/videos', name:'My Videos'}"`.

Every path json object *must* have a `path` property, and can have the following optional properties:
 - `name`: The display string, used eg in the top-left dropwdown menu. (default = use value of `path`)
 - `use_filename_as_title`: Use the filename as the video title instead of value in the info.json file (default = **false**)
 - `recursion`: The maximum recursion depth when searching for videos (default = 0, aka "do not recurse into subfolders")
 - `filter`: The filter for the files (default = "*", aka every file). Supported video extensions are filtered in a secondary step.
 - `ext_order`: Path to a file with a user-defined order (the format is the same as the youtube-dl archive files).  
                One line per video and the line order specifies the video order.  
                If some files are not found in the file they are appended at the end (This can useful in combination with the background autorefresh feature).  
                (!) You *can* simply use the youtube-dl archive file here, but be aware that ytdl-viewer can edit the file and youtube-dl does not guarantee any order in the file.   
 - `update_ext_order`: Automatically add missing files to the end of the `ext_order` file (default = **true**).  
 - `htmltitle`: Specify a custom title for the webpage when this path is selected
 - `display`: Override the default display value (from `--display=<v>`) for this path
 - `width`: Override the default list width value (from `--width=<v>`) for this path
 - `order`: Override the default order (from `--order=<v>`) for this path
 - `videomode`: Override the default playback mode (from `--videomode=<v>`) for this path
 - `thumbnailmode`: Override the default thumbnail loading mode (from `--thumbnailmode=<v>`) for this path
 - `theme`: Override the default theme (from `--theme=<v>`) for this path
 - `display_disabled`: Disable some display modes for this path
 - `width_disabled`: Disable some list widths for this path
 - `order_disabled`: Disable some ordering modes for this path
 - `videomode_disabled`: Disable some playback modes for this path
 - `thumbnailmode_disabled`: Disable some thumbnail modes for this path
 - `theme_disabled`: Disable some themes for this path 

Example configuration:
~~~
--path="{
  path:'/media/youtube-dl/Talks',     
  order:'title',                
  name:'Talks',
  ext_order:'/media/order_talks.txt',
  htmltitle: 'Playlist: Talks',                
  videomode:'transcoded',
  videomode_disabled: ['raw-seekable', 'raw', 'vlc-local']
}" 

~~~

> **[!] Note**  
> Under windows (and linux if there are any) do not forget to escape your backslashes:  
> `--path="{path:'C:\\Users\\Me\\Videos', name:'My Videos', ext_order: 'order.archive.txt'}`

#### - Custom themes

There is currently only 1 integrated theme: `default`.  
But you can supply one (or more) custom themes with `--usertheme=<path>` arguments. 
Then you can either choose the themes with the theme button n the top right corner or you can set a default theme with the `--theme=<name>` argument.

Themes must be valid css files, see **staticfiles/theme_default.css** for an example


#### - Override metadata

Video metadata is first read from the video file and the matching (same filename) additional files eg `.vtt` subtitles or `.description` descriptions.  
Then (if one exists) the `.info.json` file (generated by youtube-dl) is read for additional data.

In case you want to override some fields (or don't have a info.json) you can, as a third step, create a `{filename}.info.toml` file to override/specify metadata fields.  
The following keys are valid:
 - id
 - title
 - extractor_key
 - upload_date
 - like_count
 - dislike_count
 - uploader
 - duration 
 - webpage_url
 - view_count
 - width
 - height


## Commandline manual

You can (and should) run `youtube-dl-viewer --help` to get a list of all available commandline arguments and their possible values.  
Here are some common and useful arguments:

 - `--port=<value>`:  
   Specify the used port for the webserver (use a random one if not specified)
 - `--ip=<value>`:  
   Specify the bound interface (e.g. localhost, 0.0.0.0, ...)
 - `--cache=<value>`:  
   The cache directory for transcoded webm files, generated thumbnails and preview frames
 - `--display=<value>`, `--order=<value>`, `--width=<value>`, `--thumbnailmode=<value>`, `--videomode=<value>`:  
   Set default values for the display/playback options in the top-right
 - `--max-parallel-convert=<value>`, `--max-parallel-genprev=<value>`:  
   Limit the amount of parallel (potentially long-runnnig) jobs 
 - `--preview-width=<value>`, `--thumnail-ex-mode=<value>`, `--previewcount-max=<value>`, `--previewcount-min=<value>`, `--no-auto-previews`, `--no-ffmpeg`:  
   Options for the preview frames extraction
 - `--webm-convert-params=<value>`, `--no-ffmpeg`:  
   Options for the webm live transcode
 - `--autorefresh-interval=<seconds>`:  
   Automatically trigger a refresh (reload data from filesytem) if the last refresh is longer than <t> seconds ago.  
   Only tests the condition on web requests, if the webapp is not used the interval can be longer.  
   The default value is to never refresh (can still be triggered via the manual refresh button)
 - `--htmltitle=<value>`:  
   Specify the title of the webpage (can be overriden per path)
 - `--version`:  
   Output program version
 - `--help`:  
   Output help screen

## FAQ


#### - Can't play video

If your browser tells you `No video with supported format and MIME type found` that means that the specified playback mode (button in top right corner) failed.  

If you are on `Seekable raw file` or `Raw file` that means that the video files on your hard drive are not supported by your browser (generally only webm and mp4 are supported and in my experience only webm works good).

If you are on `Transcoded Webm stream` that means that youtube-dl-viewer could not live transcode your video file.  
First please look at the output of youtube-dl-viewer to see what exactly happened.

Common problems are:  

1. You don't have ffmpeg installed or it's not in your PATH so youtube-dl-viewer cannot execute it.
2. The (source) video is in a format that your ffmpeg installation cannot read
3. youtube-dl-viewer (or the spawned ffmpeg process) has no permission to write to your temp directory
 
#### - Debugging ffmpeg output

By specifying a dirctory in the `--ffmpeg-debug-dir` argument you can inspect the ffmpeg output.  
For every ffmpeg call we make a new file is created with the invoked command, ffmpeg output and exit code.  
This is especially useful for cases where some specific codec is not supported by your ffmpeg version

#### - realpath(): Permission denied

If you get the following error on start (on linux):
~~~
realpath(): Permission denied
Failure processing application bundle.
Failed to determine location for extracting embedded files
DOTNET_BUNDLE_EXTRACT_BASE_DIR is not set, and a read-write temp-directory couldn't be created.
A fatal error was encountered. Could not extract contents of the bundle
~~~

You need to set `DOTNET_BUNDLE_EXTRACT_BASE_DIR` to a valid path in your run script (or somewhere else such that the environment variable is set)

~~~bash
#!/bin/bash

DOTNET_BUNDLE_EXTRACT_BASE_DIR=/tmp/dot_net_cache/
export DOTNET_BUNDLE_EXTRACT_BASE_DIR

./youtube-dl-viewer
~~~


#### - The tabular view looks strange

The view mode `Tabular` uses the css subgrid feature which is currently [only supported in firefox](https://caniuse.com/#feat=css-subgrid). Which is great because I generally recommend people to not support that other company that tries to have a monopoly of every internet related thing...
