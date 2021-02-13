"use strict";
class DisplayCompactRenderer {
    render(videos, dir) {
        let html = '';
        for (const vid of videos) {
            let ve_cls = 'video_entry';
            if (vid.meta.cached)
                ve_cls += ' webm-cached';
            if (vid.meta.cached_previews)
                ve_cls += ' preview-cached';
            html += '<div class="' + ve_cls + '" data-id="' + escapeHtml(vid.meta.uid) + '">';
            html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg" alt="thumbnail" data-loaded="0" data-dirindex="' + dir.index + '" data-videoid="' + escapeHtml(vid.meta['uid']) + '" /></div></div>';
            html += '<div class="title">' + escapeHtml(vid.data.title) + '</div>';
            if (vid.data.info.hasNonNull('upload_date'))
                html += '<div class="upload_date">' + escapeHtml(formatDate(vid.data.info.upload_date)) + '</div>';
            html += '</div>';
            html += "\n\n";
        }
        return html;
    }
    async setThumbnail(thumb) {
        if (thumb.getAttribute('data-loaded') === '1')
            return true;
        let dirindex = thumb.getAttribute('data-dirindex');
        let videoid = thumb.getAttribute('data-videoid');
        const src = "/data/" + dirindex + "/video/" + escapeHtml(videoid) + "/thumb/s/fast";
        thumb.setAttribute('data-realurl-cache', src);
        if (thumb.getAttribute('src') === src)
            return true;
        return await setImageSource(thumb, src).then(ok => {
            if (!ok)
                thumb.setAttribute('src', '/thumb_empty.svg');
            thumb.setAttribute('data-loaded', ok ? '1' : '0');
            return ok;
        });
    }
    async unsetThumbnail(thumb) {
        if (thumb.getAttribute('data-loaded') === '0')
            return;
        thumb.setAttribute('src', '/thumb_empty.svg');
        thumb.setAttribute('data-loaded', '0');
    }
    initEvents() {
        for (const btn of $all('.video_entry'))
            btn.addEventListener('click', () => { App.PLAYER.showVideo(btn.getAttribute('data-id')); });
    }
}
