"use strict";
class DisplayGridRenderer {
    render(videos, dir) {
        let html = '';
        for (const vid of videos) {
            let ve_cls = 'video_entry';
            if (vid.meta.cached)
                ve_cls += ' webm-cached';
            if (vid.meta.cached_previews)
                ve_cls += ' preview-cached';
            html += '<div class="' + ve_cls + '" data-id="' + escapeHtml(vid.meta.uid) + '">';
            html += '<i class="icon_cached fas fa-cloud"></i>';
            html += '<div class="thumbnail animatable"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg" alt="thumbnail" data-loaded="0" data-realurl="/data/' + dir.index + '/video/' + escapeHtml(vid.meta.uid) + '/thumb" data-videoid="' + escapeHtml(vid.meta['uid']) + '" /></div>';
            if (vid.data.info.hasNonNull('like_count') && vid.data.info.hasNonNull('dislike_count')) {
                html += '<div class="likedislikebar">';
                html += '  <div class="like_bar" style="width: ' + (100 * vid.data.info.like_count / (vid.data.info.like_count + vid.data.info.dislike_count)) + '%"><div class="like_bar_count">' + vid.data.info.like_count + '</div></div>';
                html += '  <div class="dislike_bar" style="width: ' + (100 * vid.data.info.dislike_count / (vid.data.info.like_count + vid.data.info.dislike_count)) + '%"><div class="dislike_bar_count">' + vid.data.info.dislike_count + '</div></div>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div class="title">' + escapeHtml(vid.data.title) + '</div>';
            html += '</div>';
            html += "\n\n";
        }
        for (let i = 0; i < 16; i++) {
            html += '<div class="flexrowfiller"><div class="pseudo"></div></div>';
            html += "\n\n";
        }
        return html;
    }
    async setThumbnail(thumb) {
        if (thumb.getAttribute('data-loaded') === '1')
            return true;
        const src = thumb.getAttribute('data-realurl');
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
        for (const tmb of $all('.video_entry .thumbnail')) {
            tmb.addEventListener('mouseenter', () => { App.THUMBS.startAnimateThumbnail(tmb); });
            tmb.addEventListener('mouseleave', () => { App.THUMBS.stopAnimateThumbnail(tmb); });
        }
    }
}
