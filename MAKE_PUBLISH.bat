
dotnet clean

rm releases/youtube-dl-viewer
rm releases/youtube-dl-viewer.exe

tsc

dotnet publish -c Release -r linux-x64 /p:PublishSingleFile=true /p:PublishTrimmed=true

rm bin/Release/netcoreapp3.1/linux-x64/publish/appsettings.json
rm bin/Release/netcoreapp3.1/linux-x64/publish/appsettings.Development.json
rm bin/Release/netcoreapp3.1/linux-x64/publish/web.config
rm bin/Release/netcoreapp3.1/linux-x64/publish/youtube-dl-viewer.pdb

cp bin/Release/netcoreapp3.1/linux-x64/publish/youtube-dl-viewer releases


dotnet publish -c Release -r win-x64 /p:PublishSingleFile=true /p:PublishTrimmed=true

rm bin/Release/netcoreapp3.1/win-x64/publish/appsettings.json
rm bin/Release/netcoreapp3.1/win-x64/publish/appsettings.Development.json
rm bin/Release/netcoreapp3.1/win-x64/publish/web.config
rm bin/Release/netcoreapp3.1/win-x64/publish/youtube-dl-viewer.pdb

cp bin/Release/netcoreapp3.1/win-x64/publish/youtube-dl-viewer.exe releases



REM PAUSE