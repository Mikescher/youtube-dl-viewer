
class DisplayTabularRenderer implements DisplayRenderer
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
            if (vid.meta.cached) ve_cls += ' webm-cached';
            if (vid.meta.cached_previews) ve_cls += ' preview-cached';

            html += '<div class="' + ve_cls + '" data-id="'+escapeHtml(vid.meta.uid)+'">';

            html += '<div class="title">' + escapeHtml(vid.data.title) + '</div>';

            if (vid.data.info.hasNonNull('uploader'))
            {
                if (vid.data.info.hasNonNull('channel_url')) html += '<a href="' + escapeHtml(vid.data.info.channel_url!) + '" class="uploader">' + escapeHtml(vid.data.info.uploader!) + '</a>';
                else if (vid.data.info.hasNonNull('uploader_url')) html += '<a href="' + escapeHtml(vid.data.info.uploader_url!) + '" class="uploader">' + escapeHtml(vid.data.info.uploader!) + '</a>';
                else html += '<div class="uploader">' + escapeHtml(vid.data.info.uploader!) + '</div>';
            }
            else
            {
                html += '<div class="uploader empty"></div>'
            }

            if (vid.data.info.hasArrayWithValues('categories'))
            {
                html += '<div class="catlist">';
                for (const c of vid.data.info.categories!) html += '<div class="category">' + escapeHtml(c) + '</div>';
                html += '</div>';
            }
            else
            {
                html += '<div class="catlist empty"></div>';
            }

            if (vid.data.info.hasNonNull('view_count'))
                html += '<div class="view_count">' + escapeHtml(formatNumber(vid.data.info.view_count!)) + '</div>';
            else
                html += '<div class="view_count empty"></div>';
                
            if (vid.data.info.hasNonNull('like_count'))
                html += '<div class="like_count">' + escapeHtml(formatNumber(vid.data.info.like_count!)) + '</div>';
            else
                html += '<div class="like_count empty"></div>';
            
            if (vid.data.info.hasNonNull('dislike_count'))
                html += '<div class="dislike_count">' + escapeHtml(formatNumber(vid.data.info.dislike_count!)) + '</div>';
            else
                html += '<div class="dislike_count empty"></div>';

            if (vid.data.info.hasNonNull('upload_date')) 
                html += '<div class="upload_date">' + escapeHtml(formatDate(vid.data.info.upload_date!)) + '</div>';
            else
                html += '<div class="upload_date empty"></div>';

            html += '</div>';
            html += "\n\n";
        }

        return html;
    }

    async setThumbnail(thumb: HTMLImageElement): Promise<boolean>
    {
        // nothing to do
        return true
    }

    async unsetThumbnail(thumb: HTMLImageElement)
    {
        // nothing to do
    }

    initEvents(): void
    {
        for (const btn of $all('.video_entry')) btn.addEventListener('click', () => { App.PLAYER.showVideo(btn.getAttribute('data-id')!); });
    }

}