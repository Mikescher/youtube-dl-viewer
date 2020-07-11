const DATA = 
{
    isLoadingThumbnails: false,
    thumbnailInvocationCounter: 0,
    
    toastTimeoutID: -1,
    
    data: null,
}

function escapeHtml(text) 
{
    if (typeof text !== "string") text = (""+text).toString();
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatSeconds(sec) 
{
    if (sec <= 60) return sec + 's';

    const omin = Math.floor(sec/60);
    const osec = Math.floor(sec - (omin*60));
    return omin + 'min ' + osec + 's';
}

function formatDate(date) 
{
    return date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);
}

function formatNumber(num) 
{
    num += '';
    let rex = /(\d+)(\d{3})/;
    while (rex.test(num)) num = num.replace(rex, '$1' + '.' + '$2');
    return num;
}

window.onload = function() 
{
    for (const e of location.hash.replace('#','').split('&'))
    {
        [key, val] = e.split('=');

        if (key === 'display')   document.querySelector('.btn-display').setAttribute('data-mode', val);
        if (key === 'order')     document.querySelector('.btn-order').setAttribute('data-mode', val);
        if (key === 'width')     document.querySelector('.btn-width').setAttribute('data-mode', val);
        if (key === 'thumb')     document.querySelector('.btn-loadthumbnails').setAttribute('data-mode', val);
        if (key === 'videomode') document.querySelector('.btn-videomode').setAttribute('data-mode', val);
    }
    
    updateDisplaymodeClass(false);
    updateDisplaywidthClass(false);
    
    const request = new XMLHttpRequest();
    request.open('GET', '/data', true);

    request.onload = function()
    {
        if (this.status >= 200 && this.status < 400) 
        {
            DATA.data = this.response;
            initData(JSON.parse(DATA.data));
            initButtons();
            initEvents();
        } 
        else 
        {
            showToast('Could not load data');
        }
    };

    request.onerror = function()
    {
        showToast('Could not load data');
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

    document.querySelector('#content').innerHTML = '';
    
    let videos = data['videos'];
    
    const sortmode = parseInt(document.querySelector('.btn-order').getAttribute('data-mode'));

    if (sortmode === 0) videos = videos.sort((a,b) => sortcompare(a,b,'upload_date') * -1);
    if (sortmode === 1) videos = videos.sort((a,b) => sortcompare(a,b,'upload_date') * +1);
    if (sortmode === 2) videos = videos.sort((a,b) => sortcompare(a,b,'title'));
    if (sortmode === 3) videos = videos.sort((a,b) => sortcompare(a,b,'categories'));
    if (sortmode === 4) videos = videos.sort((a,b) => sortcompare(a,b,'views'));
    if (sortmode === 5) videos = videos.sort((a,b) => sortcompareDiv(a,b,'like_count','dislike_count') * -1);
    if (sortmode === 6) videos = videos.sort((a,b) => sortcompare(a,b,'uploader'));


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
        const meta = vid['meta'];
        const info = vid['data']['info'];

        info.__proto__ = json_proto;

        html += '<div class="video_entry" data-id="'+escapeHtml(meta['uid'])+'">';

        if (info.hasNonNull('thumbnail')) 
        {
            html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg"  alt="thumbnail" data-loaded="0" data-realurl="/video/' + escapeHtml(meta['uid']) + '/thumb" /></div>';

            if (info.hasNonNull('like_count') && info.hasNonNull('dislike_count'))
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

        if (info.hasNonNull('uploader'))
        {
            html += '<div class="info info-extractor"><i class="fas fas-user"></i></div>';

            if (info.hasNonNull('channel_url')) html += '<a href="' + escapeHtml(info["channel_url"]) + '" class="uploader">' + escapeHtml(info["uploader"]) + '</a>';
            else if (info.hasNonNull('uploader_url')) html += '<a href="' + escapeHtml(info["uploader_url"]) + '" class="uploader">' + escapeHtml(info["uploader"]) + '</a>';
            else html += '<div class="uploader">' + escapeHtml(info["uploader"]) + '</div>';

        }

        if (info.hasNonNull('duration'))
        {
            html += '<div class="info info-duration"><i class="fas fa-clock"></i></div>';
            html += '<div class="duration">' + escapeHtml(formatSeconds(info["duration"])) + '</div>';
        }


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

        if (info.hasNonNull('view_count'))
        {
            html += '<div class="info info-view_count"><i class="fas fa-eye"></i></div>';
            html += '<div class="view_count">' + escapeHtml(formatNumber(info["view_count"])) + '</div>';
        }
        
        if (info.hasNonNull('extractor')) 
        {
            html += '<div class="info info-extractor"><i class="fas fa-laptop-code"></i></div>';
            html += '<div class="extractor">' + escapeHtml(info["extractor"]) + '</div>';
        }

        if (info.hasNonNull('like_count'))
        {
            html += '<div class="info info-like_count"><i class="fas fa-thumbs-up"></i></div>';
            html += '<div class="like_count">' + escapeHtml(formatNumber(info["like_count"])) + '</div>';
        }
        if (info.hasNonNull('dislike_count'))
        {
            html += '<div class="info info-dislike_count"><i class="fas fa-thumbs-down"></i></div>';
            html += '<div class="dislike_count">' + escapeHtml(formatNumber(info["dislike_count"])) + '</div>';
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

    for (const btn of document.querySelectorAll('.btn-expand'))   btn.addEventListener('click', e => { btn.parentNode.classList.add('expanded'); e.stopPropagation(); });
    for (const btn of document.querySelectorAll('.btn-collapse')) btn.addEventListener('click', e => { btn.parentNode.classList.remove('expanded'); e.stopPropagation(); });

    for (const btn of document.querySelectorAll('.video_entry')) btn.addEventListener('click', () => { showVideo(btn.getAttribute('data-id')) });
    
    // noinspection JSIgnoredPromiseFromCall
    loadThumbnails();
}

function sortcompare(a, b, key)
{
    const va = a.data.info[key];
    const vb = b.data.info[key];

    return sortcompareValues(va, vb);
}

function sortcompareValues(va, vb)
{
    if (va === undefined && vb === undefined) return 0;
    if (va === undefined) return +1;
    if (vb === undefined) return -1;

    if (va === null && vb === null) return 0;
    if (va === null) return +1;
    if (vb === null) return -1;

    if (typeof va !== typeof vb) throw new Error('sortcompare type confusion (1)');

    if (typeof va === "number") return va - vb;
    if (typeof va === "string") return va.toLowerCase().localeCompare(vb.toLowerCase());
    if (Array.isArray(va) && Array.isArray(vb))
    {
        if (va.length > 0 && vb.length > 0) return sortcompareValues(va[0], vb[0]);
        if (va.length > 0) return -1;
        if (vb.length > 0) return +1;
    }

    throw new Error('sortcompare type confusion (2)');
}

function sortcompareDiv(a, b, key1, key2)
{
    const va1 = a.data.info[key1];
    const vb1 = b.data.info[key1];

    if (va1 === undefined && vb1 === undefined) return 0;
    if (va1 === undefined) return +1;
    if (vb1 === undefined) return -1;

    if (va1 === null && vb1 === null) return 0;
    if (va1 === null) return +1;
    if (vb1 === null) return -1;
    
    const va2 = a.data.info[key2];
    const vb2 = b.data.info[key2];

    if (va2 === undefined && vb2 === undefined) return 0;
    if (va2 === undefined) return +1;
    if (vb2 === undefined) return -1;

    if (va2 === null && vb2 === null) return 0;
    if (va2 === null) return +1;
    if (vb2 === null) return -1;

    if (typeof va1 !== "number") throw new Error('sortcompareDiv type confusion (a1)');
    if (typeof vb1 !== "number") throw new Error('sortcompareDiv type confusion (b1)');
    if (typeof va2 !== "number") throw new Error('sortcompareDiv type confusion (a2)');
    if (typeof vb2 !== "number") throw new Error('sortcompareDiv type confusion (b2)');
    
    return sortcompareValues(va1 / va2, vb1 / vb2);
}

function loadThumbnails() 
{
    DATA.thumbnailInvocationCounter++;

    const mode = parseInt(document.querySelector('.btn-loadthumbnails').getAttribute('data-mode'));
    if (mode === 0) 
    {
        unloadThumbnails(); 
    }
    else if (mode === 1)
    {
        DATA.isLoadingThumbnails = true;
        loadThumbnailsIntelligentAsync().finally(() => DATA.isLoadingThumbnails = false);
    }
    else if (mode === 2)
    {
        DATA.isLoadingThumbnails = true;
        loadThumbnailsSequentialAsync().finally(() => DATA.isLoadingThumbnails = false);
    }
    else if (mode === 3)
    {
        DATA.isLoadingThumbnails = true;
        loadThumbnailsParallelAsync().finally(() => DATA.isLoadingThumbnails = false);
    }
}

function unloadThumbnails()
{
    for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
    {
        if (thumb.getAttribute('data-loaded') === '0') continue;
        
        thumb.setAttribute('data-loaded', '0');
        thumb.setAttribute('src', '/thumb_empty.svg');
    }
}

async function loadThumbnailsIntelligentAsync()
{
    const ctr = DATA.thumbnailInvocationCounter;

    // in-viewport => parallel
    for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
    {
        if (DATA.thumbnailInvocationCounter !== ctr) return;

        if (thumb.getAttribute('data-loaded') === '1') continue;

        if (!isElementInViewport(thumb)) continue; // not visible

        const src = thumb.getAttribute('data-realurl');

        setImageSource(thumb, src).then(ok =>
        {
            if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
            thumb.setAttribute('data-loaded', '1');
        })
    }

    // in-viewport => sequential
    for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
    {
        if (DATA.thumbnailInvocationCounter !== ctr) return;

        if (thumb.getAttribute('data-loaded') === '1') continue;

        const src = thumb.getAttribute('data-realurl');

        const ok = await setImageSource(thumb, src);
        if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
        thumb.setAttribute('data-loaded', '1');
        await sleepAsync(1);
    }
}

async function loadThumbnailsSequentialAsync()
{
    const ctr = DATA.thumbnailInvocationCounter;

    for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
    {
        if (DATA.thumbnailInvocationCounter !== ctr) return;

        if (thumb.getAttribute('data-loaded') === '1') continue;

        if (!isElementInViewport(thumb)) continue; // not visible

        const src = thumb.getAttribute('data-realurl');

        const ok = await setImageSource(thumb, src);
        if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
        thumb.setAttribute('data-loaded', '1');
        await sleepAsync(1);
    }
}

async function loadThumbnailsParallelAsync()
{
    const ctr = DATA.thumbnailInvocationCounter;

    for (const thumb of document.querySelectorAll('.thumb_img_loadable'))
    {
        if (DATA.thumbnailInvocationCounter !== ctr) return;

        if (thumb.getAttribute('data-loaded') === '1') continue;

        if (!isElementInViewport(thumb)) continue; // not visible

        const src = thumb.getAttribute('data-realurl');

        setImageSource(thumb, src).then(ok =>
        {
            if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
            thumb.setAttribute('data-loaded', '1');
        })
    }
}

function isElementInViewport(el) 
{

    const rect = el.getBoundingClientRect();

    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight)
    );
}

function sleepAsync(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function setImageSource(image, src) 
{
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
        let mode = parseInt(document.querySelector('.btn-display').getAttribute('data-mode'));
        mode = (mode + 1) % 4;
        document.querySelector('.btn-display').setAttribute('data-mode', mode.toString());
        updateLocationHash();
        
        updateDisplaymodeClass(true);
        
        loadThumbnails();
    });

    document.querySelector('.btn-width').addEventListener('click', () =>
    {
        let mode = parseInt(document.querySelector('.btn-width').getAttribute('data-mode'));
        mode = (mode + 1) % 4;
        document.querySelector('.btn-width').setAttribute('data-mode', mode.toString());
        updateLocationHash();

        updateDisplaywidthClass(true);

        loadThumbnails();
    });

    document.querySelector('.btn-order').addEventListener('click', () =>
    {
        let mode = parseInt(document.querySelector('.btn-order').getAttribute('data-mode'));
        mode = (mode + 1) % 7;
        document.querySelector('.btn-order').setAttribute('data-mode', mode.toString());
        updateLocationHash();

        if (mode === 0) showToast('Sorting: Date [descending]');
        if (mode === 1) showToast('Sorting: Date [ascending]');
        if (mode === 2) showToast('Sorting: Title');
        if (mode === 3) showToast('Sorting: Category');
        if (mode === 4) showToast('Sorting: Views');
        if (mode === 5) showToast('Sorting: Rating');
        if (mode === 6) showToast('Sorting: Uploader');

        initData(JSON.parse(DATA.data));
    });

    document.querySelector('.btn-refresh').addEventListener('click', () => 
    {
        document.querySelector('#content').innerHTML = '';
        
        const request = new XMLHttpRequest();
        request.open('GET', '/refresh', true);

        request.onload = function()
        {
            if (this.status >= 200 && this.status < 400)
            {
                DATA.data = this.response;
                initData(JSON.parse(DATA.data));
            }
            else
            {
                showToast('Could not refresh data');
            }
        };

        request.onerror = function()
        {
            showToast('Could not refresh data');
        };

        request.send();
    });
    
    document.querySelector('.btn-loadthumbnails').addEventListener('click', () =>
    {
        let mode = parseInt(document.querySelector('.btn-loadthumbnails').getAttribute('data-mode'));
        mode = (mode + 1) % 4;
        document.querySelector('.btn-loadthumbnails').setAttribute('data-mode', mode.toString());
        updateLocationHash();
        
        if (mode === 0) showToast('Thumbnails: Off');
        if (mode === 1) showToast('Thumbnails: On (intelligent)');
        if (mode === 2) showToast('Thumbnails: On (sequential)');
        if (mode === 3) showToast('Thumbnails: On (parallel)');
        
        loadThumbnails();
    });

    document.querySelector('.btn-videomode').addEventListener('click', () =>
    {
        let mode = parseInt(document.querySelector('.btn-videomode').getAttribute('data-mode'));
        mode = (mode + 1) % 4;
        document.querySelector('.btn-videomode').setAttribute('data-mode', mode.toString());
        updateLocationHash();

        if (mode === 0) showToast("Playback: Disabled");
        if (mode === 1) showToast("Playback: Seekable raw file");
        if (mode === 2) showToast("Playback: Raw file");
        if (mode === 3) showToast("Playback: Transcoded Webm stream");
        if (mode === 4) showToast("Playback: Download file");

        const curr = document.querySelector('#fullsizevideo');
        if (curr !== null) showVideo(curr.getAttribute("data-id"));
    });
}

function updateLocationHash()
{
    location.hash = 'display='   + document.querySelector('.btn-display').getAttribute('data-mode')        + '&' +
                    'order='     + document.querySelector('.btn-order').getAttribute('data-mode')          + '&' +
                    'width='     + document.querySelector('.btn-width').getAttribute('data-mode')          + '&' +
                    'thumb='     + document.querySelector('.btn-loadthumbnails').getAttribute('data-mode') + '&' +
                    'videomode=' + document.querySelector('.btn-videomode').getAttribute('data-mode');
}

function updateDisplaymodeClass(toast)
{
    const main = document.querySelector('#content');

    const mode = parseInt(document.querySelector('.btn-display').getAttribute('data-mode'));

    main.classList.remove('lstyle_detailed');
    main.classList.remove('lstyle_grid');
    main.classList.remove('lstyle_compact');
    main.classList.remove('lstyle_tabular');

    if (mode === 0) { main.classList.add('lstyle_grid');     if (toast) showToast('ListStyle: Grid');     }
    if (mode === 1) { main.classList.add('lstyle_compact');  if (toast) showToast('ListStyle: Compact');  }
    if (mode === 2) { main.classList.add('lstyle_tabular');  if (toast) showToast('ListStyle: Tabular');  }
    if (mode === 3) { main.classList.add('lstyle_detailed'); if (toast) showToast('ListStyle: Detailed'); }
}

function updateDisplaywidthClass(toast)
{
    const content = document.querySelector('#content');

    const mode = parseInt(document.querySelector('.btn-width').getAttribute('data-mode'));

    content.classList.remove('lstyle_width_small');
    content.classList.remove('lstyle_width_medium');
    content.classList.remove('lstyle_width_wide');
    content.classList.remove('lstyle_width_full');

    if (mode === 0) { content.classList.add('lstyle_width_small');  if (toast) showToast('Width: Small');   }
    if (mode === 1) { content.classList.add('lstyle_width_medium'); if (toast) showToast('Width: Medium');   }
    if (mode === 2) { content.classList.add('lstyle_width_wide');   if (toast) showToast('Width: Wide');  }
    if (mode === 3) { content.classList.add('lstyle_width_full');   if (toast) showToast('Width: Full'); }
}

function initEvents() 
{
    window.addEventListener('scroll', () => { loadThumbnails(); });
}

function htmlToElement(html) 
{
    const template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function removeVideo()
{
    const vid = document.querySelector('#fullsizevideo');
    if (vid === null) return;

    const videlem = vid.querySelector('video');
    videlem.pause();
    videlem.removeAttribute('src');
    videlem.load();

    vid.parentNode.removeChild(vid);
}

function showVideo(id)
{
    const old = document.querySelector('#fullsizevideo');
    if (old !== null) removeVideo();
    
    const mode = parseInt(document.querySelector('.btn-videomode').getAttribute('data-mode'));

    if (mode === 0) return;
    
    if (mode === 4)
    {
        window.open('/video/'+escapeHtml(id)+'/file', '_blank').focus();
        return;
    }

    let html = '';

    html += '<div id="fullsizevideo" data-id="'+escapeHtml(id)+'">';
    html += '  <div class="vidcontainer">';
    html += '    <video width="320" height="240" controls autoplay>';
    if (mode === 1) html += '<source src="/video/'+escapeHtml(id)+'/seek">';
    if (mode === 2) html += '<source src="/video/'+escapeHtml(id)+'/file">';
    if (mode === 3) html += '<source src="/video/'+escapeHtml(id)+'/stream" type="video/webm">';
    html += '    </video>';
    html += '  </div>';
    html += '</div>';
    
    const main = document.querySelector('#root');
    main.insertBefore(htmlToElement(html), main.firstChild);

    const fsv = document.querySelector('#fullsizevideo');
    fsv.addEventListener('click', function () { removeVideo(); })
}

function clearToast()
{
    document.querySelector('#toast').classList.add('vanished');
}

function showToast(txt)
{
    clearTimeout(DATA.toastTimeoutID);
    const toaster = document.querySelector('#toast');
    toaster.innerText = txt;

    toaster.classList.add('vanished');
    toaster.classList.remove('active');
    DATA.toastTimeoutID = setTimeout(clearToast, 2000);
    setTimeout(() => { toaster.classList.remove('vanished'); toaster.classList.add('active'); }, 10)
}


