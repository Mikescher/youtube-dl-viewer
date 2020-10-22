
class DisplayCompactRenderer implements DisplayRenderer
{

    render(videos: DataJSONVideo[], dir: DataDirDef): string
    {
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

        for (const vid of videos)
        {
            let ve_cls = 'video_entry';
            if (vid.meta['cached']) ve_cls += ' webm-cached';
            if (vid.meta['cached_previews']) ve_cls += ' preview-cached';

            let filelink = vid.meta['path_video_abs'];
            if (filelink.startsWith('/')) filelink = 'file://'  + filelink;
            else                          filelink = 'file:///' + filelink;

            let web_url = '';
            if (vid.data.info.hasNonNull('webpage_url')) web_url = vid.data.info['webpage_url'];

            html += '<div class="' + ve_cls + '" data-id="'+escapeHtml(vid.meta['uid'])+'" data-filelink="'+escapeHtml(filelink)+'" data-weburl="'+escapeHtml(web_url)+'">';

            html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg"  alt="thumbnail" data-loaded="0" data-realurl="/data/' + dir.index + '/video/' + escapeHtml(vid.meta['uid']) + '/thumb" data-videoid="'+escapeHtml(vid.meta['uid'])+'" /></div>';
            html += '</div>';

            html += '<div class="title">' + escapeHtml(vid.data['title']) + '</div>';

            if (vid.data.info.hasNonNull('upload_date')) html += '<div class="upload_date">' + escapeHtml(formatDate(vid.data.info["upload_date"])) + '</div>';

            html += '</div>';
            html += "\n\n";
        }

        return html;
    }

}