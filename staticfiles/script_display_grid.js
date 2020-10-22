"use strict";
class DisplayGridRenderer {
    constructor(double) {
        this.double = double;
    }
    render(videos, dir) {
        let html = '';
        html += '<div class="table_header">';
        html += '    <div class="title">Titel</div>';
        html += '    <div class="uploader">Uploader</div>';
        html += '    <div class="catlist">Category</div>';
        html += '    <div class="view_count">Views</div>';
        html += '    <div class="like_count">Likes</div>';
        html += '    <div class="dislike_count">Dislikes</div>';
        html += '    <div class="upload_date">Upload date</div>';
        html += '</div>';
        for (const vid of videos) {
            let ve_cls = 'video_entry';
            if (vid.meta['cached'])
                ve_cls += ' webm-cached';
            if (vid.meta['cached_previews'])
                ve_cls += ' preview-cached';
            let filelink = vid.meta['path_video_abs'];
            if (filelink.startsWith('/'))
                filelink = 'file://' + filelink;
            else
                filelink = 'file:///' + filelink;
            let web_url = '';
            if (vid.data.info.hasNonNull('webpage_url'))
                web_url = vid.data.info.webpage_url;
            html += '<div class="' + ve_cls + '" data-id="' + escapeHtml(vid.meta['uid']) + '" data-filelink="' + escapeHtml(filelink) + '" data-weburl="' + escapeHtml(web_url) + '">';
            html += '<i class="icon_cached fas fa-cloud"></i>';
            html += '<div class="thumbnail animatable"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg" alt="thumbnail" data-loaded="0" data-realurl="/data/' + dir.index + '/video/' + escapeHtml(vid.meta['uid']) + '/thumb" data-videoid="' + escapeHtml(vid.meta['uid']) + '" /></div>';
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
        return html;
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
