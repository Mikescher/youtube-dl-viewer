DOCKER_REPO_PRIV="registry.blackforestbytes.com"
DOCKER_IMG_PRIV="mikescher/youtube-dl-viewer"
DOCKER_IMG_HUB="mikescher/youtube-dl-viewer"

build:
	dotnet build
 
run:
	dotnet run

docker-run:
	docker run -p 8080:8080 youtube-dl-viewer:latest

clean:
	dotnet clean

	rm releases/youtube-dl-viewer     || true
	rm releases/youtube-dl-viewer.exe || true

publish: clean
	dotnet publish -c Release -r linux-x64 /p:PublishSingleFile=true /p:PublishTrimmed=true

	rm bin/Release/net8.0/linux-x64/publish/appsettings.json
	rm bin/Release/net8.0/linux-x64/publish/appsettings.Development.json
	rm bin/Release/net8.0/linux-x64/publish/youtube-dl-viewer.pdb

	cp -v bin/Release/net8.0/linux-x64/publish/youtube-dl-viewer releases


	dotnet publish -c Release -r win-x64 /p:PublishSingleFile=true /p:PublishTrimmed=true

	rm bin/Release/net8.0/win-x64/publish/appsettings.json
	rm bin/Release/net8.0/win-x64/publish/appsettings.Development.json
	rm bin/Release/net8.0/win-x64/publish/youtube-dl-viewer.pdb

	cp -v bin/Release/net8.0/win-x64/publish/youtube-dl-viewer.exe releases

build-docker: publish
	docker build \
	  -t youtube-dl-viewer:$(shell git describe --abbrev=0 --tags) \
	  -t youtube-dl-viewer:latest \
	  -t $(DOCKER_IMG_HUB):$(shell git describe --abbrev=0 --tags) \
	  -t $(DOCKER_IMG_HUB):latest \
	  -t $(DOCKER_REPO_PRIV)/$(DOCKER_IMG_PRIV):$(shell git describe --abbrev=0 --tags) \
	  -t $(DOCKER_REPO_PRIV)/$(DOCKER_IMG_PRIV) \
	  .

publish-docker: build-docker
	docker image push $(DOCKER_IMG_HUB):$(shell git describe --abbrev=0 --tags)
	docker image push $(DOCKER_IMG_HUB):latest
	docker image push $(DOCKER_REPO_PRIV)/$(DOCKER_IMG_PRIV):$(shell git describe --abbrev=0 --tags)
	docker image push $(DOCKER_REPO_PRIV)/$(DOCKER_IMG_PRIV)
