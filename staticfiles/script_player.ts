
class VideoPlayerModel
{
    dom_root: HTMLDivElement;
    
    dom_fullsizevideo: HTMLElement|null = null;

    dom_headernormal: HTMLElement;
    dom_headerplayer: HTMLElement;

    dom_headertitle: HTMLElement;
    dom_headerplaybackmode: HTMLElement;
    
    constructor()
    {
        this.dom_root         = $('#root')               as HTMLDivElement;
        this.dom_headernormal = $('#header_normal')      as HTMLDivElement;
        this.dom_headerplayer = $('#header_videoplayer') as HTMLDivElement;

        this.dom_headertitle        = $('#header_videoplayer .title') as HTMLDivElement;
        this.dom_headerplaybackmode = $('#header_videoplayer .type')  as HTMLDivElement;
    }

    init() 
    {
        
    }

    removeVideo()
    {
        if (this.dom_fullsizevideo === null) return;
        
        const videlem = this.dom_fullsizevideo.querySelector('video')!;
        videlem.pause();
        videlem.removeAttribute('src');
        videlem.load();

        this.dom_fullsizevideo.parentNode!.removeChild(this.dom_fullsizevideo);

        this.dom_fullsizevideo = null;

        this.dom_headernormal.classList.remove('nodisplay');
        this.dom_headerplayer.classList.add('nodisplay');
    }

    showVideo(id: string)
    {
        if (this.dom_fullsizevideo !== null) this.removeVideo();

        if (!App.VIDEOLIST.isLoaded()) return;
        
        const vid = App.VIDEOLIST.getVideoByID(id);
        if (vid === null) return;
        
        App.VIDEOLIST.getCurrentVideoMode().play(vid);

        this.dom_headertitle.innerText        = vid.data.title;
        this.dom_headerplaybackmode.innerText = App.VIDEOLIST.getCurrentVideoMode().text;
        
        this.dom_headernormal.classList.add('nodisplay');
        this.dom_headerplayer.classList.remove('nodisplay');
    }

    showStreamplayer(video: DataJSONVideo, streamtype: string) 
    {
        let html = '';

        html += '<div id="fullsizevideo" data-id="'+escapeHtml(video.meta.uid)+'">';
        html += '  <div class="vidcontainer">';
        html += '    <video width="320" height="240" controls autoplay>';
        if (streamtype === 'seek')   html += '<source src="/data/'+App.VIDEOLIST.getCurrentDataDir().index+'/video/'+escapeHtml(video.meta.uid)+'/seek">';
        if (streamtype === 'file')   html += '<source src="/data/'+App.VIDEOLIST.getCurrentDataDir().index+'/video/'+escapeHtml(video.meta.uid)+'/file">';
        if (streamtype === 'stream') html += '<source src="/data/'+App.VIDEOLIST.getCurrentDataDir().index+'/video/'+escapeHtml(video.meta.uid)+'/stream" type="video/webm">';
        html += '    </video>';
        html += '  </div>';
        html += '</div>';

        this.dom_root.insertBefore(htmlToElement(html), this.dom_root.firstChild);
        this.dom_fullsizevideo = $('#fullsizevideo');

        this.dom_fullsizevideo?.addEventListener('click', () => this.removeVideo());
    }

    openFile(video: DataJSONVideo) 
    {
        window.open('/data/'+App.VIDEOLIST.getCurrentDataDir().index+'/video/'+escapeHtml(video.meta.uid)+'/file', '_blank')?.focus();
    }

    openVLCStream(video: DataJSONVideo) 
    {
        window.open('vlc://'+window.location.protocol + "//" + window.location.host + '/data/'+App.VIDEOLIST.getCurrentDataDir().index+'/video/'+escapeHtml(video.meta.uid)+'/seek', '_self');
    }

    openVLC(video: DataJSONVideo) 
    {
        let filelink = video.meta.path_video_abs;

        let suffix = "";
        if (filelink.match(/^[A-Z]:\\/) != null)
        {
            suffix = filelink.substr(0, 2) + '/';
            filelink = filelink.substr(3);
        }
        
        filelink = filelink.replace("\\", "/"); // windows
        
        filelink = filelink.split('/').map(p => extEncodeURIComponent(p)).join('/');
        
        if (filelink.startsWith('/')) filelink = 'file://'  + suffix + filelink;
        else                          filelink = 'file:///' + suffix + filelink;

        window.open('vlc://' + filelink, '_self');
        return;
    }

    openURL(video: DataJSONVideo) 
    {
        const wpu = video.data.info.webpage_url;
        if (wpu !== null && wpu !== undefined) window.open(wpu, '_blank');
    }
}

