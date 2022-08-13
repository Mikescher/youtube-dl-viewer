FROM mcr.microsoft.com/dotnet/runtime:6.0

################################################################################
#
# Should map:
#  - /app/config.runconf                  ( extra config arguments )
#  - /cache                               ( ytdlv cache data )
#  - /data/*                              ( put videos/etc here )
#
################################################################################

RUN mkdir -p /app && mkdir -p /dotnet-cache -p /cache -p /data

ADD releases/youtube-dl-viewer /app/youtube-dl-viewer
ADD _docker/run.sh /app/run.sh
ADD _docker/ffmpeg /ffmpeg/ffmpeg
ADD _docker/ffprobe /ffmpeg/ffprobe

WORKDIR /app

EXPOSE 8080

ENTRYPOINT [ "./run.sh" ]

