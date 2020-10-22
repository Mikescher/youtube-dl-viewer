
class DisplayDetailedRenderer implements DisplayRenderer
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

            html += '<i class="icon_cached fas fa-cloud"></i>';

            {
                html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg"  alt="thumbnail" data-loaded="0" data-realurl="/data/' + dir.index + '/video/' + escapeHtml(vid.meta['uid']) + '/thumb" data-videoid="'+escapeHtml(vid.meta['uid'])+'" /></div>';

                if (vid.data.info.hasNonNull('like_count') && vid.data.info.hasNonNull('dislike_count'))
                {
                    html += '<div class="likedislikebar">';
                    html += '  <div class="like_bar" style="width: ' + (100 * vid.data.info["like_count"] / (vid.data.info["like_count"] + vid.data.info["dislike_count"])) + '%"><div class="like_bar_count">' + escapeHtml(vid.data.info["like_count"]) + '</div></div>';
                    html += '  <div class="dislike_bar" style="width: ' + (100 * vid.data.info["dislike_count"] / (vid.data.info["like_count"] + vid.data.info["dislike_count"])) + '%"><div class="dislike_bar_count">' + escapeHtml(vid.data.info["dislike_count"]) + '</div></div>';
                    html += '</div>';
                }

                html += '</div>';
            }

            html += '<div class="title">' + escapeHtml(vid.data['title']) + '</div>';

            if (vid.data.info.hasNonNull('uploader'))
            {
                html += '<div class="info info-extractor"><i class="fas fas-user"></i></div>';

                if (vid.data.info.hasNonNull('channel_url')) html += '<a href="' + escapeHtml(vid.data.info["channel_url"]) + '" class="uploader">' + escapeHtml(vid.data.info["uploader"]) + '</a>';
                else if (vid.data.info.hasNonNull('uploader_url')) html += '<a href="' + escapeHtml(vid.data.info["uploader_url"]) + '" class="uploader">' + escapeHtml(vid.data.info["uploader"]) + '</a>';
                else html += '<div class="uploader">' + escapeHtml(vid.data.info["uploader"]) + '</div>';

            }

            if (vid.data.info.hasNonNull('duration'))
            {
                html += '<div class="info info-duration"><i class="fas fa-clock"></i></div>';
                html += '<div class="duration">' + escapeHtml(formatSeconds(vid.data.info["duration"])) + '</div>';
            }

            if (vid.data.info.hasArrayWithValues('categories'))
            {
                html += '<div class="info info-catlist"><i class="fas fa-tag"></i></div>';

                html += '<div class="catlist">';
                for (const c of vid.data.info['categories']) html += '<div class="category">' + escapeHtml(c) + '</div>';
                html += '</div>';
            }

            if (vid.data.info.hasArrayWithValues('tags'))
            {
                html += '<div class="taglist">';
                for (const t of vid.data.info['tags']) html += '<div class="tag">' + escapeHtml(t) + '</div>';
                html += '</div>';
            }

            if (vid.data.info.hasNonNull('view_count'))
            {
                html += '<div class="info info-view_count"><i class="fas fa-eye"></i></div>';
                html += '<div class="view_count">' + escapeHtml(formatNumber(vid.data.info["view_count"])) + '</div>';
            }

            if (vid.data.info.hasNonNull('extractor_key'))
            {
                html += '<div class="info info-extractor"><i class="fas fa-laptop-code"></i></div>';
                html += '<div class="extractor">' + escapeHtml(vid.data.info["extractor_key"]) + '</div>';
            }

            if (vid.data.info.hasNonNull('like_count'))
            {
                html += '<div class="info info-like_count"><i class="fas fa-thumbs-up"></i></div>';
                html += '<div class="like_count">' + escapeHtml(formatNumber(vid.data.info["like_count"])) + '</div>';
            }
            if (vid.data.info.hasNonNull('dislike_count'))
            {
                html += '<div class="info info-dislike_count"><i class="fas fa-thumbs-down"></i></div>';
                html += '<div class="dislike_count">' + escapeHtml(formatNumber(vid.data.info["dislike_count"])) + '</div>';
            }

            if (vid.data.info.hasNonNull('width') && vid.data.info.has('height'))
            {
                html += '<div class="info info-size"><i class="fas fa-th-large"></i></div>';
                html += '<div class="size">' + escapeHtml(vid.data.info["width"]) + 'x' + escapeHtml(vid.data.info["height"]) + '</div>';
            }

            if (vid.data.info.hasNonNull('upload_date')) html += '<div class="upload_date">' + escapeHtml(formatDate(vid.data.info["upload_date"])) + '</div>';

            if (vid.data['description'] !== null) html += '<div class="description">' + escapeHtml(vid.data['description']) + '</div>';

            html += '<div class="btn-expand"><i class="fas fa-angle-down"></i></div>';
            html += '<div class="btn-collapse"><i class="fas fa-angle-up"></i></div>';

            html += '</div>';
            html += "\n\n";
        }

        return html;
    }

}