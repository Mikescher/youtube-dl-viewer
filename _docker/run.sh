#!/bin/sh

DOTNET_BUNDLE_EXTRACT_BASE_DIR=/dotnet-cache
export DOTNET_BUNDLE_EXTRACT_BASE_DIR

DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_CLI_TELEMETRY_OPTOUT

if [ -f "/app/config.runconf" ]; then
    ./youtube-dl-viewer --config-location="/app/config.runconf" --ip=0.0.0.0 --port=8080 --cache="/cache" --exec-ffmpeg="/ffmpeg/ffmpeg" --exec-ffprobe="/ffmpeg/ffprobe"
else
    ./youtube-dl-viewer                                         --ip=0.0.0.0 --port=8080 --cache="/cache" --exec-ffmpeg="/ffmpeg/ffmpeg" --exec-ffprobe="/ffmpeg/ffprobe"
fi


