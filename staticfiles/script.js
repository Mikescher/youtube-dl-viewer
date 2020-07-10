const DATA = 
{
    isLoadingThumbnails: false,
    loadMoreThumbnails: false,
}

function escapeHtml(text) {
    if (typeof text !== "string") text = (""+text).toString();
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
    return date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);
}

function formatNumber(num) {
    num += '';
    let rex = /(\d+)(\d{3})/;
    while (rex.test(num)) num = num.replace(rex, '$1' + '.' + '$2');
    return num;
}

window.onload = function() 
{
    const request = new XMLHttpRequest();
    request.open('GET', '/data', true);

    request.onload = function() {
        if (this.status >= 200 && this.status < 400) 
        {
            // Success!
            initData(JSON.parse(this.response));
            initButtons();
            initEvents();
        } else 
        {
            // TODO
        }
    };

    request.onerror = function() {
        // TODO
    };

    request.send();
};

function initData(data)
{
    const json_proto = 
    {
        has: function(key) { return Object.hasOwnProperty.call(this, key); },
        hasNonNull: function(key) { return this.has(key) && this[key] != null; },
        hasArrayWithValues: function(key) { return this.hasNonNull(key) && Object.hasOwnProperty.call(this[key], 'length') && this[key].length > 0; },
    }
        
    let html = '';
    for (const vid of data['videos'])
    {
        const meta = vid['meta'];
        const info = vid['data']['info'];

        info.__proto__ = json_proto;

        html += '<div class="video_entry" data-id="'+escapeHtml(meta['uid'])+'">';

        if (info.hasNonNull('thumbnail')) 
        {
            html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg"  alt="thumbnail" data-loaded="0" data-realurl="/thumb/' + escapeHtml(meta['uid']) + ' " /></div>';

            if (info.hasNonNull('like_count') && info.has('dislike_count'))
            {
                html += '<div class="likedislikebar">';
                html += '  <div class="like_bar" style="width: ' + (100 * info["like_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="like_bar_count">' + escapeHtml(info["like_count"]) + '</div></div>';
                html += '  <div class="dislike_bar" style="width: ' + (100 * info["dislike_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="dislike_bar_count">' + escapeHtml(info["dislike_count"]) + '</div></div>';
                html += '</div>';
            }

            html += '</div>';
        }
        else 
        {
            html += '<div class="thumbnail"><div class="thumbnail_img"><img src="/thumb_empty.svg" alt="thumbnail" /></div> ';

            if (info.hasNonNull('like_count') && info.has('dislike_count'))
            {
                html += '<div class="likedislikebar">';
                html += '  <div class="like_bar" style="width: ' + (100 * info["like_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="like_bar_count">' + escapeHtml(info["like_count"]) + '</div></div>';
                html += '  <div class="dislike_bar" style="width: ' + (100 * info["dislike_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="dislike_bar_count">' + escapeHtml(info["dislike_count"]) + '</div></div>';
                html += '</div>';
            }

            html += '</div>';
        }
        
        if (info.hasNonNull('fulltitle')) html += '<div class="title">' + escapeHtml(info['fulltitle']) + '</div>';
        else if (info.hasNonNull('title')) html += '<div class="title">' + escapeHtml(info['title']) + '</div>';


        if (info.hasArrayWithValues('categories')) 
        {
            html += '<div class="info info-catlist"><i class="fas fa-tag"></i></div>';
            
            html += '<div class="catlist">';
            for (const c of info['categories']) html += '<div class="category">' + escapeHtml(c) + '</div>';
            html += '</div>';
        }
        
        if (info.hasArrayWithValues('tags'))
        {
            html += '<div class="taglist">';
            for (const t of info['tags']) html += '<div class="tag">' + escapeHtml(t) + '</div>';
            html += '</div>';
        }

        if (info.hasNonNull('webpage_url')) html += '<a href="' + escapeHtml(info['webpage_url']) + '" class="url">' + escapeHtml(info['webpage_url']) + '</a>';

        if (info.hasNonNull('duration')) 
        {
            html += '<div class="info info-duration"><i class="fas fa-clock"></i></div>';
            html += '<div class="duration">' + escapeHtml(formatSeconds(info["duration"])) + '</div>';
        }

        if (info.hasNonNull('extractor')) 
        {
            html += '<div class="info info-extractor"><i class="fas fa-laptop-code"></i></div>';
            html += '<div class="extractor">' + escapeHtml(info["extractor"]) + '</div>';
        }

        if (info.hasNonNull('uploader')) 
        {
            html += '<div class="info info-extractor"><i class="fas fas-user"></i></div>';
            
            if (info.hasNonNull('channel_url')) html += '<a href="' + escapeHtml(info["channel_url"]) + '" class="uploader">' + escapeHtml(info["uploader"]) + '</a>';
            else if (info.hasNonNull('uploader_url')) html += '<a href="' + escapeHtml(info["uploader_url"]) + '" class="uploader">' + escapeHtml(info["uploader"]) + '</a>';
            else html += '<div class="uploader">' + escapeHtml(info["uploader"]) + '</div>';
                
        }

        if (info.hasNonNull('like_count'))
        {
            html += '<div class="info info-like_count"><i class="fas fa-thumbs-up"></i></div>';
            html += '<div class="like_count">' + escapeHtml(formatNumber(info["like_count"])) + '</div>';
        }
        if (info.has('dislike_count'))
        {
            html += '<div class="info info-dislike_count"><i class="fas fa-thumbs-down"></i></div>';
            html += '<div class="dislike_count">' + escapeHtml(formatNumber(info["dislike_count"])) + '</div>';
        }

        if (info.hasNonNull('view_count')) 
        {
            html += '<div class="info info-view_count"><i class="fas fa-eye"></i></div>';
            html += '<div class="view_count">' + escapeHtml(formatNumber(info["view_count"])) + '</div>';
        }

        if (info.hasNonNull('width') && info.has('height')) 
        {
            html += '<div class="info info-size"><i class="fas fa-th-large"></i></div>';
            html += '<div class="size">' + escapeHtml(info["width"]) + 'x' + escapeHtml(info["height"]) + '</div>';
        }

        if (info.hasNonNull('upload_date')) html += '<div class="upload_date">' + escapeHtml(formatDate(info["upload_date"])) + '</div>';

        if (vid['data']['description'] !== null) html += '<div class="description">' + escapeHtml(vid['data']['description']) + '</div>';
        else if (info.hasNonNull('description')) html += '<div class="description">' + escapeHtml(info['description']) + '</div>';

        html += '<div class="btn-expand"><i class="fas fa-angle-down"></i></div>';
        html += '<div class="btn-collapse"><i class="fas fa-angle-up"></i></div>';
        
        html += '</div>';
        html += "\n\n";
    }

    document.querySelector('#content').innerHTML = html;

    for (const btn of document.querySelectorAll('.btn-expand'))   btn.addEventListener('click', () => { btn.parentNode.classList.add('expanded'); });
    for (const btn of document.querySelectorAll('.btn-collapse')) btn.addEventListener('click', () => { btn.parentNode.classList.remove('expanded'); });

    for (const btn of document.querySelectorAll('.video_entry')) btn.addEventListener('click', () => { showVideo(btn.getAttribute('data-id')) });
    
    // noinspection JSIgnoredPromiseFromCall
    loadThumbnails();
}

function loadThumbnails() 
{
    if (DATA.isLoadingThumbnails) { DATA.loadMoreThumbnails = true; return; }

    DATA.isLoadingThumbnails = true;
    loadThumbnailsAsync().finally(() => DATA.isLoadingThumbnails = false);
}

function unloadThumbnails()
{
    for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
    {
        thumb.setAttribute('data-loaded', '0');
        thumb.setAttribute('src', '/thumb_empty.svg');
    }
}
    
async function loadThumbnailsAsync()
{
    let first = true;
    while (first || DATA.loadMoreThumbnails)
    {
        first = false;
        DATA.loadMoreThumbnails = false;
        
        for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
        {
            if (document.querySelector('.btn-loadthumbnails').getAttribute('data-active') !== '1') return;

            if (thumb.getAttribute('data-loaded') === '1') continue;

            if (!isElementInViewport(thumb)) continue; // not visible

            const src = thumb.getAttribute('data-realurl');

            const ok = await setImageSource(thumb, src);
            if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
            thumb.setAttribute('data-loaded', '1');

            //await sleepAsync(50);
        }
    }
}

function isElementInViewport(el) {

    const rect = el.getBoundingClientRect();

    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight)
    );
}

function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function setImageSource(image, src) {
    return new Promise(resolve => 
    {
        let resolved = false;
        image.onload = function () {
            if (resolved) return;
            resolved = true;
            image.onload = null;
            image.onerror = null;
            resolve(true);
        }
        image.onerror = function () {
            if (resolved) return;
            resolved = true;
            image.onload = null;
            image.onerror = null;
            resolve(false);
        }
        image.src = src;
    });
}

function initButtons()
{
    document.querySelector('.btn-display').addEventListener('click', () => 
    {
        const main = document.querySelector('#content');
        
             if (main.classList.contains('lstyle_detailed')) { main.classList.remove('lstyle_detailed'); main.classList.add('lstyle_grid');     }
        else if (main.classList.contains('lstyle_grid'))     { main.classList.remove('lstyle_grid');     main.classList.add('lstyle_compact');  }
        else if (main.classList.contains('lstyle_compact'))  { main.classList.remove('lstyle_compact');  main.classList.add('lstyle_tabular');  }
        else if (main.classList.contains('lstyle_tabular'))  { main.classList.remove('lstyle_tabular');  main.classList.add('lstyle_detailed'); }
    });

    document.querySelector('.btn-width').addEventListener('click', () =>
    {
        const main = document.querySelector('#content');

             if (main.classList.contains('lstyle_width_medium')) { main.classList.remove('lstyle_width_medium'); main.classList.add('lstyle_width_wide');   }
        else if (main.classList.contains('lstyle_width_wide'))   { main.classList.remove('lstyle_width_wide');   main.classList.add('lstyle_width_full');   }
        else if (main.classList.contains('lstyle_width_full'))   { main.classList.remove('lstyle_width_full');   main.classList.add('lstyle_width_small');  }
        else if (main.classList.contains('lstyle_width_small'))  { main.classList.remove('lstyle_width_small');  main.classList.add('lstyle_width_medium'); }
    });

    document.querySelector('.btn-order').addEventListener('click', () =>
    {
        //TODO
    });

    document.querySelector('.btn-loadthumbnails').addEventListener('click', () =>
    {
        let active = document.querySelector('.btn-loadthumbnails').getAttribute('data-active') === '1';
        active = !active;
        document.querySelector('.btn-loadthumbnails').setAttribute('data-active', active ? '1' : '0');
        // noinspection JSIgnoredPromiseFromCall
        if (active) loadThumbnails(); else unloadThumbnails();
    });

    document.querySelector('.btn-videomode').addEventListener('click', () =>
    {
        let mode = parseInt(document.querySelector('.btn-videomode').getAttribute('data-mode'));
        mode = (mode + 1) % 3;
        document.querySelector('.btn-videomode').setAttribute('data-mode', mode.toString());
        const curr = document.querySelector('#fullsizevideo');
        if (curr !== null)
        {
            showVideo(curr.getAttribute("data-id"));
        }
    });
}

function initEvents() {
    window.addEventListener('scroll', function(e)
    {
        loadThumbnails();
    });
}

function htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function showVideo(id)
{
    const old = document.querySelector('#fullsizevideo');
    if (old !== null) old.parentNode.removeChild(old);
    
    const mode = parseInt(document.querySelector('.btn-videomode').getAttribute('data-mode'));
    
    let html = '';

    html += '<div id="fullsizevideo" data-id="'+escapeHtml(id)+'">';
    html += '  <div class="vidcontainer">';
    html += '    <video width="320" height="240" controls autoplay>';
    if (mode === 0) html += '<source src="/video/'+escapeHtml(id)+'/seek">';
    if (mode === 1) html += '<source src="/video/'+escapeHtml(id)+'/file">';
    if (mode === 2) html += '<source src="/video/'+escapeHtml(id)+'/stream" type="video/webm">';
    html += '    </video>';
    html += '  </div>';
    html += '</div>';
    
    const main = document.querySelector('#root');
    main.insertBefore(htmlToElement(html), main.firstChild);

    const fsv = document.querySelector('#fullsizevideo');
    fsv.addEventListener('click', function () { main.removeChild(fsv); })
}