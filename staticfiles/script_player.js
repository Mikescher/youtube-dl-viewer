"use strict";
class VideoPlayerModel {
    constructor() {
        this.dom_fullsizevideo = null;
        this.dom_root = $('#root');
    }
    init() {
    }
    removeVideo() {
        if (this.dom_fullsizevideo === null)
            return;
        const videlem = this.dom_fullsizevideo.querySelector('video');
        videlem.pause();
        videlem.removeAttribute('src');
        videlem.load();
        this.dom_fullsizevideo.parentNode.removeChild(this.dom_fullsizevideo);
        this.dom_fullsizevideo = null;
    }
    showVideo(id) {
        if (this.dom_fullsizevideo !== null)
            this.removeVideo();
        if (!App.VIDEOLIST.isLoaded())
            return;
        const vid = App.VIDEOLIST.getVideoByID(id);
        if (vid === null)
            return;
        App.VIDEOLIST.getCurrentVideoMode().play(vid);
    }
    showStreamplayer(video, streamtype) {
        var _a;
        let html = '';
        html += '<div id="fullsizevideo" data-id="' + escapeHtml(video.meta.uid) + '">';
        html += '  <div class="vidcontainer">';
        html += '    <video width="320" height="240" controls autoplay>';
        if (streamtype === 'seek')
            html += '<source src="/data/' + App.VIDEOLIST.getCurrentDataDir().index + '/video/' + escapeHtml(video.meta.uid) + '/seek">';
        if (streamtype === 'file')
            html += '<source src="/data/' + App.VIDEOLIST.getCurrentDataDir().index + '/video/' + escapeHtml(video.meta.uid) + '/file">';
        if (streamtype === 'stream')
            html += '<source src="/data/' + App.VIDEOLIST.getCurrentDataDir().index + '/video/' + escapeHtml(video.meta.uid) + '/stream" type="video/webm">';
        html += '    </video>';
        html += '  </div>';
        html += '</div>';
        this.dom_root.insertBefore(htmlToElement(html), this.dom_root.firstChild);
        this.dom_fullsizevideo = $('#fullsizevideo');
        (_a = this.dom_fullsizevideo) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.removeVideo());
    }
    openFile(video) {
        var _a;
        (_a = window.open('/data/' + App.VIDEOLIST.getCurrentDataDir().index + '/video/' + escapeHtml(video.meta.uid) + '/file', '_blank')) === null || _a === void 0 ? void 0 : _a.focus();
    }
    openVLCStream(video) {
        window.open('vlc://' + window.location.protocol + "//" + window.location.host + '/data/' + App.VIDEOLIST.getCurrentDataDir().index + '/video/' + escapeHtml(video.meta.uid) + '/seek', '_self');
    }
    openVLC(video) {
        let filelink = video.meta.path_video_abs;
        if (filelink.startsWith('/'))
            filelink = 'file://' + filelink;
        else
            filelink = 'file:///' + filelink;
        window.open('vlc://' + filelink, '_self');
        return;
    }
    openURL(video) {
        const wpu = video.data.info.webpage_url;
        if (wpu !== null && wpu !== undefined)
            window.open(wpu, '_blank');
    }
}
