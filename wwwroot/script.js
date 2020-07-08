function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatSeconds(sec) {
    if (sec <= 60) return sec + 's';

    const omin = Math.floor(sec/60);
    const osec = Math.floor(sec - (omin*60));
    return omin + 'min ' + osec + 's';
}

function formatDate(date) {
    return date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.sub(6, 2);
}

window.onload = function() { 
    initData();
    initButtons();
};

function initData()
{
    const data = JSON.parse(document.querySelector('#json_data').getAttribute('data-json'));

    let html = '';
    for (const vid of data['videos'])
    {
        const meta = vid['meta'];
        const info = vid['data']['info'];

        info.prototype.has = function(key) { return Object.hasOwnProperty.call(info, key); }

        html += '<div class="video_entry" data-id="'+escapeHtml(meta['uid'])+'">';

        if (info.has('thumbnail')) html += '<div class="thumbnail"><img src="/thumb_empty.svg"  alt="thumbnail" data-realurl="/thumb/'+escapeHtml(meta['uid'])+'." /></div>';
        else html += '<div class="thumbnail"><img src="/thumb_empty.svg" alt="thumbnail" /></div>';
        
        if (info.has('fulltitle')) html += '<div class="title">' + escapeHtml(info['fulltitle']) + '</div>';
        else if (info.has('title')) html += '<div class="title">' + escapeHtml(info['title']) + '</div>';

        if (info.has('category')) 
        {
            html += '<div class="catlist">';
            for (const c of info['category']) html += '<div class="category">' + escapeHtml(c) + '</div>';
            html += '</div>';
        }
        
        if (info.has('tags'))
        {
            html += '<div class="taglist">';
            for (const t of info['tags']) html += '<div class="tag">' + escapeHtml(t) + '</div>';
            html += '</div>';
        }

        if (info.has('webpage_url')) html += '<a href="' + escapeHtml(info['webpage_url']) + '" class="url">' + escapeHtml(info['webpage_url']) + '</a>';

        if (info.has('duration')) html += '<div class="duration">' + escapeHtml(formatSeconds(info["duration"])) + '</div>';

        if (info.has('extractor')) html += '<div class="extractor">' + escapeHtml(info["extractor"]) + '</div>';

        if (info.has('uploader')) html += '<div class="uploader">' + escapeHtml(info["uploader"]) + '</div>';

        if (info.has('like_count') && info.has('dislike_count')) 
        {
            html += '<div class="like_count">' + escapeHtml(info["like_count"]) + '</div>';
            html += '<div class="dislike_count">' + escapeHtml(info["dislike_count"]) + '</div>';
        }

        if (info.has('view_count')) html += '<div class="view_count">' + escapeHtml(info["view_count"]) + '</div>';

        if (info.has('width') && info.has('height')) html += '<div class="size">' + escapeHtml(info["width"]) + 'x' + escapeHtml(info["height"]) + '</div>';

        if (info.has('upload_date')) html += '<div class="view_count">' + escapeHtml(formatDate(info["upload_date"])) + '</div>';

        html += '</div>';
        html += "\n\n";
    }

    document.querySelector('main').innerHTML = html;
}

function initButtons()
{
    document.querySelector('.btn-display').addEventListener('click', () => 
    {
        //TODO
    });

    document.querySelector('.btn-order').addEventListener('click', () =>
    {
        //TODO
    });
}