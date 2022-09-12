DOCKER_REPO="registry.blackforestbytes.com"

build:
	dotnet build
 
run:
	dotnet run

docker-run:
	docker run -p 8080:8080 youtube-dl-viewer:latest

clean:
	dotnet clean

	rm releases/youtube-dl-viewer
	rm releases/youtube-dl-viewer.exe

publish: clean
	dotnet publish -c Release -r linux-x64 /p:PublishSingleFile=true /p:PublishTrimmed=true

	rm bin/Release/netcoreapp3.1/linux-x64/publish/appsettings.json
	rm bin/Release/netcoreapp3.1/linux-x64/publish/appsettings.Development.json
	rm bin/Release/netcoreapp3.1/linux-x64/publish/web.config
	rm bin/Release/netcoreapp3.1/linux-x64/publish/youtube-dl-viewer.pdb

	cp -v bin/Release/netcoreapp3.1/linux-x64/publish/youtube-dl-viewer releases


	dotnet publish -c Release -r win-x64 /p:PublishSingleFile=true /p:PublishTrimmed=true

	rm bin/Release/netcoreapp3.1/win-x64/publish/appsettings.json
	rm bin/Release/netcoreapp3.1/win-x64/publish/appsettings.Development.json
	rm bin/Release/netcoreapp3.1/win-x64/publish/web.config
	rm bin/Release/netcoreapp3.1/win-x64/publish/youtube-dl-viewer.pdb

	cp -v bin/Release/netcoreapp3.1/win-x64/publish/youtube-dl-viewer.exe releases

build-docker: publish
	docker build \
	  -t youtube-dl-viewer:$(shell git describe --abbrev=0 --tags) \
	  -t youtube-dl-viewer:latest \
	  -t mikescher/youtube-dl-viewer:$(shell git describe --abbrev=0 --tags) \
	  -t mikescher/youtube-dl-viewer:latest \
	  -t $(DOCKER_REPO)/youtube-dl-viewer:$(shell git describe --abbrev=0 --tags) \
	  -t $(DOCKER_REPO)/youtube-dl-viewer \
	  .

publish-docker: build-docker
	docker image push mikescher/youtube-dl-viewer:$(shell git describe --abbrev=0 --tags)
	docker image push mikescher/youtube-dl-viewer:latest
	docker image push $(DOCKER_REPO)/youtube-dl-viewer:$(shell git describe --abbrev=0 --tags)
	docker image push $(DOCKER_REPO)/youtube-dl-viewer
