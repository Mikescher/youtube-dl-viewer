/*
    [ seedrandom ]

Copyright 2019 David Bau.
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);

/*
    [ youtube-dl-viewer ]
*/

const DATA = 
{
    isLoadingThumbnails: false,
    thumbnailInvocationCounter: 0,
    
    toastTimeoutID: -1,
    
    dataidx: 0,
    
    data: null,
    
    dropDownIDCounter: 10000,

    currentAnimatedPreview: '',

    shuffle_seed: Math.random().toString().replace(/[.,]/g, '').substr(1),
}

$     = function(sel)       { return document.querySelector(sel); };
$all  = function(sel)       { return document.querySelectorAll(sel); };
$attr = function(sel, attr) { return document.querySelector(sel).getAttribute(attr); }
$ajax = function(method, url) 
{
    return new Promise(resolve => 
    {
        const request = new XMLHttpRequest();
        request.open(method, url, true);

        request.onload  = function() 
        {
            let headerMap = {};
            request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(function (line) { const parts = line.split(': '); const header = parts.shift(); headerMap[header.toLowerCase()] = parts.join(': '); });
            resolve({success: true, status: this.status, statusText: this.statusText, body: this.response, headers: headerMap });
        }
        request.onerror  = function()
        {
            resolve({ success: false, status: null, statusText: null, body: null, headers: null });
        }
        
        request.send();
    });
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

function shuffle(a, srand) 
{
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(srand.double() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

window.onload = async function() 
{
    DATA.dataidx = parseInt($attr('.apppath', 'data-initial'));
    
    for (const e of location.hash.replace('#','').split('&'))
    {
        const [key, val] = e.split('=');

        if (key === 'display')   $('.btn-display').setAttribute('data-mode', val);
        if (key === 'order')     $('.btn-order').setAttribute('data-mode', val);
        if (key === 'width')     $('.btn-width').setAttribute('data-mode', val);
        if (key === 'thumb')     $('.btn-loadthumbnails').setAttribute('data-mode', val);
        if (key === 'videomode') $('.btn-videomode').setAttribute('data-mode', val);
        if (key === 'dir')       DATA.dataidx = parseInt(val);
        if (key === 'seed')      DATA.shuffle_seed = val;
    }
    
    updateDisplaymodeClass(false);
    updateDisplaywidthClass(false);
    updateVideomodeClass();

    $('.apppath span').innerHTML = escapeHtml(JSON.parse($attr('.apppath', 'data-dirs-name'))[DATA.dataidx]);

    {
        let len_dropdown = 0;
        for (const n of JSON.parse($attr('.apppath', 'data-dirs-name')))
        {
            $('#font_test_header').innerText = n;
            const w = $('#font_test_header').clientWidth;
            len_dropdown = Math.max(len_dropdown, w);
        }
        len_dropdown = (len_dropdown + 1+4+4+1 + 10 + 14);
        $('#apppath_dropdown').style.width = len_dropdown + "px";
        $('.apppath').style.width = len_dropdown + "px";
        $('.apppath').style.float = "inherit";
    }
    
    await loadDataFromServer(true);
};

async function loadDataFromServer(initial)
{
    $('#content').innerHTML = '';
    
    const response = await $ajax('GET', '/data/'+DATA.dataidx+'/json');

    if (response.success && response.status >= 200 && response.status < 400)
    {
        DATA.data = response.body;
        initData(JSON.parse(DATA.data));
        if (initial) initButtons();
        if (initial) initEvents();
    }
    else
    {
        showToast('Could not load data');
    }
}

function initData(data)
{
    const json_proto = 
    {
        has: function(key) { return Object.hasOwnProperty.call(this, key); },
        hasNonNull: function(key) { return this.has(key) && this[key] != null; },
        hasArrayWithValues: function(key) { return this.hasNonNull(key) && Object.hasOwnProperty.call(this[key], 'length') && this[key].length > 0; },
    }

    $('#content').innerHTML = '';
    
    let videos = data['videos'];
    
    const sortmode = parseInt($attr('.btn-order', 'data-mode'));

    if (sortmode === 0) videos = videos.sort((a,b) => sortcompare(a,b,'upload_date') * -1);
    if (sortmode === 1) videos = videos.sort((a,b) => sortcompare(a,b,'upload_date') * +1);
    if (sortmode === 2) videos = videos.sort((a,b) => sortcompareData(a,b,'title'));
    if (sortmode === 3) videos = videos.sort((a,b) => sortcompare(a,b,'categories'));
    if (sortmode === 4) videos = videos.sort((a,b) => sortcompare(a,b,'view_count'));
    if (sortmode === 5) videos = videos.sort((a,b) => sortcompareDiv(a,b,'like_count','dislike_count') * -1);
    if (sortmode === 6) videos = videos.sort((a,b) => sortcompare(a,b,'uploader'));
    if (sortmode === 7) videos = shuffle(videos, new Math.seedrandom(DATA.shuffle_seed));


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
        const data = vid['data'];
        const info = data['info'];

        info.__proto__ = json_proto;

        let ve_cls = 'video_entry';
        if (meta['cached']) ve_cls += ' webm-cached';
        if (meta['cached_previews']) ve_cls += ' preview-cached';
        
        let filelink = meta['path_video_abs'];
        if (filelink.startsWith('/')) filelink = 'file://'  + filelink;
        else                          filelink = 'file:///' + filelink;
        
        html += '<div class="' + ve_cls + '" data-id="'+escapeHtml(meta['uid'])+'" data-filelink="'+escapeHtml(filelink)+'">';

        html += '<i class="icon_cached fas fa-cloud"></i>';
        
        {
            html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg"  alt="thumbnail" data-loaded="0" data-realurl="/data/' + DATA.dataidx + '/video/' + escapeHtml(meta['uid']) + '/thumb" data-videoid="'+escapeHtml(meta['uid'])+'" /></div>';

            if (info.hasNonNull('like_count') && info.hasNonNull('dislike_count'))
            {
                html += '<div class="likedislikebar">';
                html += '  <div class="like_bar" style="width: ' + (100 * info["like_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="like_bar_count">' + escapeHtml(info["like_count"]) + '</div></div>';
                html += '  <div class="dislike_bar" style="width: ' + (100 * info["dislike_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="dislike_bar_count">' + escapeHtml(info["dislike_count"]) + '</div></div>';
                html += '</div>';
            }

            html += '</div>';
        }
        
        html += '<div class="title">' + escapeHtml(data['title']) + '</div>';

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

        if (data['description'] !== null) html += '<div class="description">' + escapeHtml(data['description']) + '</div>';

        html += '<div class="btn-expand"><i class="fas fa-angle-down"></i></div>';
        html += '<div class="btn-collapse"><i class="fas fa-angle-up"></i></div>';
        
        html += '</div>';
        html += "\n\n";
    }

    $('#content').innerHTML = html;

    for (const btn of $all('.btn-expand'))   btn.addEventListener('click', e => { btn.parentNode.classList.add('expanded'); e.stopPropagation(); });
    for (const btn of $all('.btn-collapse')) btn.addEventListener('click', e => { btn.parentNode.classList.remove('expanded'); e.stopPropagation(); });

    for (const btn of $all('.video_entry')) btn.addEventListener('click', () => { showVideo(btn.getAttribute('data-id'), btn.getAttribute('data-filelink')); });

    for (const tmb of $all('.video_entry .thumbnail'))
    {
        tmb.addEventListener('mouseenter', () => { onMouseEnterThumbnail(tmb); });
        tmb.addEventListener('mouseleave', () => { onMouseLeaveThumbnail(tmb); });
    }

    // noinspection JSIgnoredPromiseFromCall
    loadThumbnails();
}

function sortcompare(a, b, key)
{
    const va = a.data.info[key];
    const vb = b.data.info[key];

    return sortcompareValues(va, vb);
}

function sortcompareData(a, b, key)
{
    const va = a.data[key];
    const vb = b.data[key];

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

    const mode = parseInt($attr('.btn-loadthumbnails', 'data-mode'));
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
    for (const thumb of $all('.thumb_img_loadable'))
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
    for (const thumb of $all('.thumb_img_loadable'))
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

    // all => sequential
    for (const thumb of $all('.thumb_img_loadable'))
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

    for (const thumb of $all('.thumb_img_loadable'))
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

    for (const thumb of $all('.thumb_img_loadable'))
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
    $('.btn-display').addEventListener('click', () => 
    {
        const current = parseInt($attr('.btn-display', 'data-mode'));
        const options = JSON.parse($attr('.btn-display', 'data-options'));

        showOptionDropDown('display', current, options, [], v =>
        {
            $('.btn-display').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();

            updateDisplaymodeClass(true);

            loadThumbnails();
        });
    });

    $('.btn-width').addEventListener('click', () =>
    {
        const current = parseInt($attr('.btn-width', 'data-mode'));
        const options = JSON.parse($attr('.btn-width', 'data-options'));

        showOptionDropDown('width', current, options, [], v =>
        {
            $('.btn-width').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();

            updateDisplaywidthClass(true);

            loadThumbnails();
        });
    });

    $('.btn-order').addEventListener('click', () =>
    {
        const current = parseInt($attr('.btn-order', 'data-mode'));
        const options = JSON.parse($attr('.btn-order', 'data-options'));
        
        showOptionDropDown('order', current, options, [], v => 
        {
            if (v === 7) DATA.shuffle_seed = Math.random().toString().replace(/[.,]/g, '').substr(1);
            
            $('.btn-order').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            
            initData(JSON.parse(DATA.data));
        });
    });

    $('.btn-loadthumbnails').addEventListener('click', () =>
    {
        const current = parseInt($attr('.btn-loadthumbnails', 'data-mode'));
        const options = JSON.parse($attr('.btn-loadthumbnails', 'data-options'));

        showOptionDropDown('loadthumbnails', current, options, [], v =>
        {
            $('.btn-loadthumbnails').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();

            loadThumbnails();
        });
    });

    $('.btn-videomode').addEventListener('click', () =>
    {
        const current = parseInt($attr('.btn-videomode', 'data-mode'));
        const options = JSON.parse($attr('.btn-videomode', 'data-options'));

        let disabled = [];
        if ($attr('main', 'data-has_ffmpeg').toLowerCase() === 'false') disabled.push(3);
        
        showOptionDropDown('videomode', current, options, disabled, v =>
        {
            $('.btn-videomode').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            
            updateVideomodeClass();

            const curr = $('#fullsizevideo');
            if (curr !== null) showVideo(curr.getAttribute("data-id"), curr.getAttribute("data-filelink"));
        });
    });

    $('.btn-refresh').addEventListener('click', async () =>
    {
        showToast('Refreshing data');

        $('#content').innerHTML = '';

        const response = await $ajax('GET', '/data/'+DATA.dataidx+'/refresh');

        if (response.success && response.status >= 200 && response.status < 400)
        {
            DATA.data = response.body;
            initData(JSON.parse(DATA.data));

            showToast('Data refreshed');
        }
        else
        {
            showToast('Could not load data');
        }
    });

    const apm = $('.apppath.multiple');
    if (apm !== null) 
    {
        apm.addEventListener('click', () => 
        { 
            if ($('#apppath_dropdown.hidden') !== null) 
                showPathDropDown();
            else 
                hidePathDropDown();
        });
        for (const row of $all('#apppath_dropdown .row'))
        {
            row.addEventListener('click', () => 
            {
                hidePathDropDown();
                if (DATA.dataidx !== parseInt(row.getAttribute('data-idx')))
                {
                    $('.apppath span').innerHTML = escapeHtml(row.getAttribute('data-name'));
                    DATA.dataidx = parseInt(row.getAttribute('data-idx'));
                    updateLocationHash();
                    loadDataFromServer(false);
                }
            });
        }
    }
}

function updateLocationHash()
{
    let hash = [];

    if ($attr('.btn-display', 'data-mode') !== $attr('.btn-display', 'data-initial'))
        hash.push('display=' + $attr('.btn-display', 'data-mode'));

    if ($attr('.btn-order', 'data-mode') !== $attr('.btn-order', 'data-initial'))
        hash.push('order=' + $attr('.btn-order', 'data-mode'));

    if ($attr('.btn-order', 'data-mode') === '7')
        hash.push('seed=' + DATA.shuffle_seed);
    
    if ($attr('.btn-width', 'data-mode') !== $attr('.btn-width', 'data-initial'))
        hash.push('width=' + $attr('.btn-width', 'data-mode'));

    if ($attr('.btn-loadthumbnails', 'data-mode') !== $attr('.btn-loadthumbnails', 'data-initial'))
        hash.push('thumb=' + $attr('.btn-loadthumbnails', 'data-mode'));

    if ($attr('.btn-videomode', 'data-mode') !== $attr('.btn-videomode', 'data-initial'))
        hash.push('videomode=' + $attr('.btn-videomode', 'data-mode'));

    if (DATA.dataidx !== parseInt($attr('.apppath', 'data-initial')))
        hash.push('dir='   + DATA.dataidx);
    
    location.hash = hash.join('&');
}

function updateDisplaymodeClass(toast)
{
    const main = $('#content');

    const mode = parseInt($attr('.btn-display', 'data-mode'));

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
    const content = $('#content');

    const mode = parseInt($attr('.btn-width', 'data-mode'));

    content.classList.remove('lstyle_width_small');
    content.classList.remove('lstyle_width_medium');
    content.classList.remove('lstyle_width_wide');
    content.classList.remove('lstyle_width_full');

    if (mode === 0) { content.classList.add('lstyle_width_small');  if (toast) showToast('Width: Small');   }
    if (mode === 1) { content.classList.add('lstyle_width_medium'); if (toast) showToast('Width: Medium');   }
    if (mode === 2) { content.classList.add('lstyle_width_wide');   if (toast) showToast('Width: Wide');  }
    if (mode === 3) { content.classList.add('lstyle_width_full');   if (toast) showToast('Width: Full'); }
}

function updateVideomodeClass()
{
    const content = $('#content');

    const mode = parseInt($attr('.btn-videomode', 'data-mode'));

    for (let i=0; i<10; i++) content.classList.remove('lstyle_videomode_'+i);

    content.classList.add('lstyle_videomode_'+mode);
}

function initEvents() 
{
    window.addEventListener('scroll', () => { loadThumbnails(); });

    $('#dropdown_background').addEventListener('click', () => 
    {
        hideAllDropDowns();
    });
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
    const vid = $('#fullsizevideo');
    if (vid === null) return;

    const videlem = vid.querySelector('video');
    videlem.pause();
    videlem.removeAttribute('src');
    videlem.load();

    vid.parentNode.removeChild(vid);
}

function showVideo(id, filelink)
{
    const old = $('#fullsizevideo');
    if (old !== null) removeVideo();

    const mode = parseInt($('.btn-videomode').getAttribute('data-mode'));

    if (mode === 0) return;

    if (mode === 4)
    {
        window.open('/data/'+DATA.dataidx+'/video/'+escapeHtml(id)+'/file', '_blank').focus();
        return;
    }

    if (mode === 5)
    {
        window.open('vlc://'+window.location.protocol + "//" + window.location.host + '/data/'+DATA.dataidx+'/video/'+escapeHtml(id)+'/seek', '_self');
        return;
    }

    if (mode === 6)
    {
        window.open('vlc://'+filelink, '_self');
        return;
    }

    let html = '';

    html += '<div id="fullsizevideo" data-id="'+escapeHtml(id)+'" data-filelink="'+escapeHtml(filelink)+'">';
    html += '  <div class="vidcontainer">';
    html += '    <video width="320" height="240" controls autoplay>';
    if (mode === 1) html += '<source src="/data/'+DATA.dataidx+'/video/'+escapeHtml(id)+'/seek">';
    if (mode === 2) html += '<source src="/data/'+DATA.dataidx+'/video/'+escapeHtml(id)+'/file">';
    if (mode === 3) html += '<source src="/data/'+DATA.dataidx+'/video/'+escapeHtml(id)+'/stream" type="video/webm">';
    html += '    </video>';
    html += '  </div>';
    html += '</div>';
    
    const main = $('#root');
    main.insertBefore(htmlToElement(html), main.firstChild);

    const fsv = $('#fullsizevideo');
    fsv.addEventListener('click', function () { removeVideo(); })
}

function clearToast()
{
    $('#toast').classList.add('vanished');
}

function showToast(txt)
{
    clearTimeout(DATA.toastTimeoutID);
    const toaster = $('#toast');
    toaster.innerText = txt;

    toaster.classList.add('vanished');
    toaster.classList.remove('active');
    DATA.toastTimeoutID = setTimeout(clearToast, 2000);
    setTimeout(() => { toaster.classList.remove('vanished'); toaster.classList.add('active'); }, 10)
}

function hideAllDropDowns() 
{
    hidePathDropDown();
    hideOptionDropDown();

    $('#dropdown_background').classList.add('hidden');
}

function showPathDropDown()
{
    hideAllDropDowns();
    
    const img = $('.apppath i');
    img.classList.remove('fa-chevron-down');
    img.classList.add('fa-chevron-up');

    $('#apppath_dropdown').classList.remove('hidden');

    $('#dropdown_background').classList.remove('hidden');
}

function hidePathDropDown()
{
    const img = $('.apppath i');
    img.classList.add('fa-chevron-down');
    img.classList.remove('fa-chevron-up');

    $('#apppath_dropdown').classList.add('hidden');
    
    $('#dropdown_background').classList.add('hidden');
}

function showOptionDropDown(type, current, options, disabledids, lambda)
{
    const dd = $('#option_dropdown');
    
    if (dd.getAttribute('data-ddtype') === type) { hideAllDropDowns(); return; }
    
    hideAllDropDowns();
    
    let ids = [];
    
    let html = '';
    for (let i=0; i < options.length; i++)
    {
        if (disabledids.includes(i)) continue;
        const elemid = 'drow_' + (DATA.dropDownIDCounter++);
        let cls = 'row';
        if (i === current) cls += ' active';
        html += '<div id="'+elemid+'" class="'+cls+'" data-value="'+escapeHtml(options[i])+'" data-idx="'+i+'">'+escapeHtml(options[i])+'</div>';
        ids.push(elemid);
    }
    
    dd.innerHTML = html;
    dd.classList.remove('hidden');

    dd.setAttribute('data-ddtype', type);

    for (const id of ids)
    {
        const elem = $('#' + id);
        elem.addEventListener('click', () => 
        {
            hideOptionDropDown();
            lambda(parseInt(elem.getAttribute('data-idx'))); 
        });
    }
    
    $('#dropdown_background').classList.remove('hidden');
}

function hideOptionDropDown()
{
    $('#option_dropdown').classList.add('hidden');
    $('#option_dropdown').setAttribute('data-ddtype', 'none');

    $('#dropdown_background').classList.add('hidden');
}

async function onMouseEnterThumbnail(elem)
{
    let content = $('#content');
    
    if (parseInt($attr('.btn-loadthumbnails', 'data-mode')) === 0) return;

    if ($attr('main', 'data-has_ffmpeg').toLowerCase() === 'false') return;
    if ($attr('main', 'data-has_cache').toLowerCase() === 'false') return;
    
    if (!content.classList.contains('lstyle_grid') && !content.classList.contains('lstyle_detailed')) return;
    
    let img = elem.querySelector('img');
    if (img.getAttribute('data-loaded') !== '1') return;
    
    let video_id = img.getAttribute('data-videoid');

    DATA.currentAnimatedPreview = video_id;

    const response = await $ajax('GET', '/data/'+DATA.dataidx+'/video/'+video_id+'/prev/'+0);

    if (response.success && response.status >= 200 && response.status < 400)
    {
        const c = parseInt(response.headers['previewimagecount']);

        await animateThumbnailPreview(img, c, video_id);
    }
    else
    {
        console.error('Could not load preview images (status)');
    }
}

async function animateThumbnailPreview(img, max, video_id)
{
    for (let i=1;;i++)
    {
        if (DATA.currentAnimatedPreview !== video_id) return;
        
        const t = performance.now();
        await setImageSource(img, '/data/'+DATA.dataidx+'/video/'+video_id+'/prev/'+(i%max));
        await sleepAsync(Math.max(0, 333 - (performance.now() - t)));

        if (((i+1)%max) === 0) await sleepAsync(666);
    }
}

function onMouseLeaveThumbnail(elem)
{
    let img = elem.querySelector('img');
    if (img.getAttribute('data-loaded') !== '1') return;

    let video_id = img.getAttribute('data-videoid');
    
    if (DATA.currentAnimatedPreview !== video_id)
    {
        DATA.currentAnimatedPreview = '';
        return;
    }

    DATA.currentAnimatedPreview = '';
    img.src = img.getAttribute('data-realurl');
}
