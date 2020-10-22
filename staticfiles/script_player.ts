
class VideoPlayerModel
{
    dom_root: HTMLDivElement;
    
    dom_fullsizevideo: HTMLElement|null = null;
    
    constructor()
    {
        this.dom_root = $('#root') as HTMLDivElement;
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
    }

    showVideo(id: string)
    {
        if (this.dom_fullsizevideo !== null) this.removeVideo();

        if (!App.VIDEOLIST.isLoaded()) return;
        
        const vid = App.VIDEOLIST.getVideoByID(id);
        if (vid === null) return;
        
        App.VIDEOLIST.getCurrentVideoMode().play(vid);
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
        if (filelink.startsWith('/')) filelink = 'file://'  + filelink;
        else                          filelink = 'file:///' + filelink;

        window.open('vlc://'+filelink, '_self');
        return;
    }

    openURL(video: DataJSONVideo) 
    {
        const wpu = video.data.info.webpage_url;
        if (wpu !== null && wpu !== undefined) window.open(wpu, '_blank');
    }
}

