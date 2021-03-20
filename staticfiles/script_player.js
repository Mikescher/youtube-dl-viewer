"use strict";
class VideoPlayerModel {
    constructor() {
        this.dom_fullsizevideo = null;
        this.dom_root = $('#root');
        this.dom_headernormal = $('#header_normal');
        this.dom_headerplayer = $('#header_videoplayer');
        this.dom_headertitle = $('#header_videoplayer .title');
        this.dom_headerplaybackmode = $('#header_videoplayer .type');
    }
    init() {
        window.addEventListener('keydown', function (event) {
            if (event.key === 'Escape')
                App.PLAYER.removeVideo();
        });
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
        this.dom_headernormal.classList.remove('nodisplay');
        this.dom_headerplayer.classList.add('nodisplay');
        App.VIDEOLIST.updateHash();
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
        this.dom_headertitle.innerText = video.data.title;
        this.dom_headerplaybackmode.innerText = App.VIDEOLIST.getCurrentVideoMode().text;
        this.dom_headernormal.classList.add('nodisplay');
        this.dom_headerplayer.classList.remove('nodisplay');
        location.hash = 'play=' + App.VIDEOLIST.getCurrentDataDir().keys[0] + '::' + video.meta.uid;
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
        let suffix = "";
        if (filelink.match(/^[A-Z]:\\/) != null) {
            suffix = filelink.substr(0, 2) + '/';
            filelink = filelink.substr(3);
        }
        filelink = filelink.replace("\\", "/"); // windows
        filelink = filelink.split('/').map(p => extEncodeURIComponent(p)).join('/');
        if (filelink.startsWith('/'))
            filelink = 'file://' + suffix + filelink;
        else
            filelink = 'file:///' + suffix + filelink;
        window.open('vlc://' + filelink, '_self');
        return;
    }
    openURL(video) {
        const wpu = video.data.info.webpage_url;
        if (wpu !== null && wpu !== undefined)
            window.open(wpu, '_blank');
    }
}
