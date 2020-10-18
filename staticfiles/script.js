"use strict";
/*
    [ youtube-dl-viewer ]
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var DATA = {
    isLoadingThumbnails: false,
    thumbnailInvocationCounter: 0,
    toastTimeoutID: -1,
    dataidx: 0,
    data: null,
    dropDownIDCounter: 10000,
    currentAnimatedPreview: '',
    shuffle_seed: Math.random().toString().replace(/[.,]/g, '').substr(1),
};
function $(sel) {
    return document.querySelector(sel);
}
function $all(sel) {
    return document.querySelectorAll(sel);
}
function $attr(sel, attr) {
    return document.querySelector(sel).getAttribute(attr);
}
function $ajax(method, url) {
    return new Promise(function (resolve) {
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = function () {
            var headerMap = {};
            request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(function (line) { var parts = line.split(': '); var header = parts.shift(); headerMap[header.toLowerCase()] = parts.join(': '); });
            resolve({ success: true, status: this.status, statusText: this.statusText, body: this.response, headers: headerMap });
        };
        request.onerror = function () {
            resolve({ success: false, status: null, statusText: null, body: null, headers: null });
        };
        request.send();
    });
}
function escapeHtml(text) {
    if (typeof text !== "string")
        text = ("" + text).toString();
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
function formatSeconds(sec) {
    if (sec <= 60)
        return sec + 's';
    var omin = Math.floor(sec / 60);
    var osec = Math.floor(sec - (omin * 60));
    return omin + 'min ' + osec + 's';
}
function formatDate(date) {
    return date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);
}
function formatNumber(num) {
    num += '';
    var rex = /(\d+)(\d{3})/;
    while (rex.test(num))
        num = num.replace(rex, '$1' + '.' + '$2');
    return num;
}
function shuffle(a, srand) {
    var _a;
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(srand.double() * (i + 1));
        _a = [a[j], a[i]], a[i] = _a[0], a[j] = _a[1];
    }
    return a;
}
window.onload = function () {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, e, _b, key, val, len_dropdown, _c, _d, n, w;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    DATA.dataidx = parseInt($attr('.apppath', 'data-initial'));
                    for (_i = 0, _a = location.hash.replace('#', '').split('&'); _i < _a.length; _i++) {
                        e = _a[_i];
                        _b = e.split('='), key = _b[0], val = _b[1];
                        if (key === 'display')
                            $('.btn-display').setAttribute('data-mode', val);
                        if (key === 'order')
                            $('.btn-order').setAttribute('data-mode', val);
                        if (key === 'width')
                            $('.btn-width').setAttribute('data-mode', val);
                        if (key === 'thumb')
                            $('.btn-loadthumbnails').setAttribute('data-mode', val);
                        if (key === 'videomode')
                            $('.btn-videomode').setAttribute('data-mode', val);
                        if (key === 'theme')
                            $('.btn-theme').setAttribute('data-mode', val);
                        if (key === 'dir')
                            DATA.dataidx = parseInt(val);
                        if (key === 'seed')
                            DATA.shuffle_seed = val;
                    }
                    updateDisplaymodeClass(false);
                    updateDisplaywidthClass(false);
                    updateTheme(false);
                    updateVideomodeClass();
                    $('.apppath span').innerHTML = escapeHtml(JSON.parse($attr('.apppath', 'data-dirs-name'))[DATA.dataidx]);
                    {
                        len_dropdown = 0;
                        for (_c = 0, _d = JSON.parse($attr('.apppath', 'data-dirs-name')); _c < _d.length; _c++) {
                            n = _d[_c];
                            $('#font_test_header').innerText = n;
                            w = $('#font_test_header').clientWidth;
                            len_dropdown = Math.max(len_dropdown, w);
                        }
                        len_dropdown = (len_dropdown + 1 + 4 + 4 + 1 + 10 + 14);
                        $('#apppath_dropdown').style.width = len_dropdown + "px";
                        $('.apppath').style.width = len_dropdown + "px";
                        $('.apppath').style.float = "inherit";
                    }
                    return [4 /*yield*/, loadDataFromServer(true)];
                case 1:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
};
function loadDataFromServer(initial) {
    return __awaiter(this, void 0, void 0, function () {
        var response, json, order_updated, currentOrder, options, currentDisplay, options, currentWidth, options, currentVideomode, options, currentThememode, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    $('#content').innerHTML = '';
                    return [4 /*yield*/, $ajax('GET', '/data/' + DATA.dataidx + '/json')];
                case 1:
                    response = _a.sent();
                    if (response.success && response.status >= 200 && response.status < 400) {
                        DATA.data = response.body;
                        json = JSON.parse(DATA.data);
                        // OVERRIDE ORDER
                        {
                            order_updated = false;
                            currentOrder = parseInt($attr('.btn-order', 'data-mode'));
                            if (json.meta.order_override !== null && json.meta.order_override !== currentOrder) {
                                currentOrder = json.meta.order_override;
                                $('.btn-order').setAttribute('data-mode', currentOrder.toString());
                                order_updated = true;
                            }
                            if (!json.meta.has_ext_order) {
                                order_updated = true;
                                if (currentOrder === 7 || currentOrder === 8) {
                                    currentOrder = parseInt($attr('.btn-order', 'data-initial'));
                                    $('.btn-order').setAttribute('data-mode', currentOrder.toString());
                                    if (currentOrder === 7 || currentOrder === 8) {
                                        currentOrder = 0;
                                        $('.btn-order').setAttribute('data-mode', currentOrder.toString());
                                    }
                                }
                            }
                            if (order_updated) {
                                options = JSON.parse($attr('.btn-order', 'data-options'));
                                if (!initial)
                                    showToast(options[currentOrder]);
                                updateLocationHash();
                            }
                        }
                        // OVERRIDE DISPLAY
                        {
                            currentDisplay = parseInt($attr('.btn-display', 'data-mode'));
                            if (json.meta.display_override !== null && json.meta.display_override !== currentDisplay) {
                                currentDisplay = json.meta.display_override;
                                $('.btn-display').setAttribute('data-mode', currentDisplay.toString());
                                options = JSON.parse($attr('.btn-display', 'data-options'));
                                showToast(options[currentDisplay]);
                                updateLocationHash();
                                updateDisplaymodeClass(!initial);
                                loadThumbnails();
                            }
                        }
                        // OVERRIDE WIDTH
                        {
                            currentWidth = parseInt($attr('.btn-width', 'data-mode'));
                            if (json.meta.width_override !== null && json.meta.width_override !== currentWidth) {
                                currentWidth = json.meta.width_override;
                                $('.btn-width').setAttribute('data-mode', currentWidth.toString());
                                options = JSON.parse($attr('.btn-width', 'data-options'));
                                showToast(options[currentWidth]);
                                updateLocationHash();
                                updateDisplaywidthClass(!initial);
                                loadThumbnails();
                            }
                        }
                        // OVERRIDE PLAYBACK
                        {
                            currentVideomode = parseInt($attr('.btn-videomode', 'data-mode'));
                            if (json.meta.videomode_override !== null && json.meta.videomode_override !== currentVideomode) {
                                currentVideomode = json.meta.videomode_override;
                                $('.btn-videomode').setAttribute('data-mode', currentVideomode.toString());
                                options = JSON.parse($attr('.btn-videomode', 'data-options'));
                                showToast(options[currentVideomode]);
                                updateLocationHash();
                                updateVideomodeClass();
                            }
                        }
                        // OVERRIDE PLAYBACK
                        {
                            currentThememode = parseInt($attr('.btn-theme', 'data-mode'));
                            if (json.meta.theme_override !== null && json.meta.theme_override !== currentThememode) {
                                currentThememode = json.meta.theme_override;
                                $('.btn-theme').setAttribute('data-mode', currentThememode.toString());
                                options = JSON.parse($attr('.btn-theme', 'data-options'));
                                showToast(options[currentThememode]);
                                updateLocationHash();
                                updateTheme(!initial);
                            }
                        }
                        initData(json);
                        if (initial)
                            initButtons();
                        if (initial)
                            initEvents();
                    }
                    else {
                        showToast('Could not load data');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function initData(data) {
    var json_proto = {
        has: function (key) { return Object.hasOwnProperty.call(this, key); },
        hasNonNull: function (key) { return this.has(key) && this[key] != null; },
        hasArrayWithValues: function (key) { return this.hasNonNull(key) && Object.hasOwnProperty.call(this[key], 'length') && this[key].length > 0; },
    };
    $('#content').innerHTML = '';
    var videos = data['videos'];
    var sortmode = parseInt($attr('.btn-order', 'data-mode'));
    if (sortmode === 0)
        videos = videos.sort(function (a, b) { return sortcompare(a, b, 'upload_date') * -1; });
    if (sortmode === 1)
        videos = videos.sort(function (a, b) { return sortcompare(a, b, 'upload_date') * +1; });
    if (sortmode === 2)
        videos = videos.sort(function (a, b) { return sortcompareData(a, b, 'title'); });
    if (sortmode === 3)
        videos = videos.sort(function (a, b) { return sortcompare(a, b, 'categories'); });
    if (sortmode === 4)
        videos = videos.sort(function (a, b) { return sortcompare(a, b, 'view_count'); });
    if (sortmode === 5)
        videos = videos.sort(function (a, b) { return sortcompareDiv(a, b, 'like_count', 'dislike_count') * -1; });
    if (sortmode === 6)
        videos = videos.sort(function (a, b) { return sortcompare(a, b, 'uploader'); });
    if (sortmode === 7)
        videos = videos.sort(function (a, b) { return sortcompareMeta(a, b, 'ext_order_index') * -1; });
    if (sortmode === 8)
        videos = videos.sort(function (a, b) { return sortcompareMeta(a, b, 'ext_order_index') * +1; });
    if (sortmode === 9)
        videos = shuffle(videos, new Math.seedrandom(DATA.shuffle_seed));
    if (sortmode === 10)
        videos = videos.sort(function (a, b) { return sortcompareMeta(a, b, 'filename_base') * +1; });
    if (sortmode === 11)
        videos = videos.sort(function (a, b) { return sortcompareMeta(a, b, 'filename_base') * -1; });
    var html = '';
    html += '<div class="table_header">';
    html += '    <div class="title">Titel</div>';
    html += '    <div class="uploader">Uploader</div>';
    html += '    <div class="catlist">Category</div>';
    html += '    <div class="view_count">Views</div>';
    html += '    <div class="like_count">Likes</div>';
    html += '    <div class="dislike_count">Dislikes</div>';
    html += '    <div class="upload_date">Upload date</div>';
    html += '</div>';
    for (var _i = 0, videos_1 = videos; _i < videos_1.length; _i++) {
        var vid = videos_1[_i];
        var meta = vid['meta'];
        var data_1 = vid['data'];
        var info = data_1['info'];
        info.__proto__ = json_proto;
        var ve_cls = 'video_entry';
        if (meta['cached'])
            ve_cls += ' webm-cached';
        if (meta['cached_previews'])
            ve_cls += ' preview-cached';
        var filelink = meta['path_video_abs'];
        if (filelink.startsWith('/'))
            filelink = 'file://' + filelink;
        else
            filelink = 'file:///' + filelink;
        var web_url = '';
        if (info.hasNonNull('webpage_url'))
            web_url = info['webpage_url'];
        html += '<div class="' + ve_cls + '" data-id="' + escapeHtml(meta['uid']) + '" data-filelink="' + escapeHtml(filelink) + '" data-weburl="' + escapeHtml(web_url) + '">';
        html += '<i class="icon_cached fas fa-cloud"></i>';
        {
            html += '<div class="thumbnail"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg"  alt="thumbnail" data-loaded="0" data-realurl="/data/' + DATA.dataidx + '/video/' + escapeHtml(meta['uid']) + '/thumb" data-videoid="' + escapeHtml(meta['uid']) + '" /></div>';
            if (info.hasNonNull('like_count') && info.hasNonNull('dislike_count')) {
                html += '<div class="likedislikebar">';
                html += '  <div class="like_bar" style="width: ' + (100 * info["like_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="like_bar_count">' + escapeHtml(info["like_count"]) + '</div></div>';
                html += '  <div class="dislike_bar" style="width: ' + (100 * info["dislike_count"] / (info["like_count"] + info["dislike_count"])) + '%"><div class="dislike_bar_count">' + escapeHtml(info["dislike_count"]) + '</div></div>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '<div class="title">' + escapeHtml(data_1['title']) + '</div>';
        if (info.hasNonNull('uploader')) {
            html += '<div class="info info-extractor"><i class="fas fas-user"></i></div>';
            if (info.hasNonNull('channel_url'))
                html += '<a href="' + escapeHtml(info["channel_url"]) + '" class="uploader">' + escapeHtml(info["uploader"]) + '</a>';
            else if (info.hasNonNull('uploader_url'))
                html += '<a href="' + escapeHtml(info["uploader_url"]) + '" class="uploader">' + escapeHtml(info["uploader"]) + '</a>';
            else
                html += '<div class="uploader">' + escapeHtml(info["uploader"]) + '</div>';
        }
        if (info.hasNonNull('duration')) {
            html += '<div class="info info-duration"><i class="fas fa-clock"></i></div>';
            html += '<div class="duration">' + escapeHtml(formatSeconds(info["duration"])) + '</div>';
        }
        if (info.hasArrayWithValues('categories')) {
            html += '<div class="info info-catlist"><i class="fas fa-tag"></i></div>';
            html += '<div class="catlist">';
            for (var _a = 0, _b = info['categories']; _a < _b.length; _a++) {
                var c = _b[_a];
                html += '<div class="category">' + escapeHtml(c) + '</div>';
            }
            html += '</div>';
        }
        if (info.hasArrayWithValues('tags')) {
            html += '<div class="taglist">';
            for (var _c = 0, _d = info['tags']; _c < _d.length; _c++) {
                var t = _d[_c];
                html += '<div class="tag">' + escapeHtml(t) + '</div>';
            }
            html += '</div>';
        }
        if (info.hasNonNull('webpage_url'))
            html += '<a href="' + escapeHtml(info['webpage_url']) + '" class="url">' + escapeHtml(info['webpage_url']) + '</a>';
        if (info.hasNonNull('view_count')) {
            html += '<div class="info info-view_count"><i class="fas fa-eye"></i></div>';
            html += '<div class="view_count">' + escapeHtml(formatNumber(info["view_count"])) + '</div>';
        }
        if (info.hasNonNull('extractor_key')) {
            html += '<div class="info info-extractor"><i class="fas fa-laptop-code"></i></div>';
            html += '<div class="extractor">' + escapeHtml(info["extractor_key"]) + '</div>';
        }
        if (info.hasNonNull('like_count')) {
            html += '<div class="info info-like_count"><i class="fas fa-thumbs-up"></i></div>';
            html += '<div class="like_count">' + escapeHtml(formatNumber(info["like_count"])) + '</div>';
        }
        if (info.hasNonNull('dislike_count')) {
            html += '<div class="info info-dislike_count"><i class="fas fa-thumbs-down"></i></div>';
            html += '<div class="dislike_count">' + escapeHtml(formatNumber(info["dislike_count"])) + '</div>';
        }
        if (info.hasNonNull('width') && info.has('height')) {
            html += '<div class="info info-size"><i class="fas fa-th-large"></i></div>';
            html += '<div class="size">' + escapeHtml(info["width"]) + 'x' + escapeHtml(info["height"]) + '</div>';
        }
        if (info.hasNonNull('upload_date'))
            html += '<div class="upload_date">' + escapeHtml(formatDate(info["upload_date"])) + '</div>';
        if (data_1['description'] !== null)
            html += '<div class="description">' + escapeHtml(data_1['description']) + '</div>';
        html += '<div class="btn-expand"><i class="fas fa-angle-down"></i></div>';
        html += '<div class="btn-collapse"><i class="fas fa-angle-up"></i></div>';
        html += '</div>';
        html += "\n\n";
    }
    $('#content').innerHTML = html;
    var _loop_1 = function (btn) {
        btn.addEventListener('click', function (e) { btn.parentNode.classList.add('expanded'); e.stopPropagation(); });
    };
    for (var _e = 0, _f = $all('.btn-expand'); _e < _f.length; _e++) {
        var btn = _f[_e];
        _loop_1(btn);
    }
    var _loop_2 = function (btn) {
        btn.addEventListener('click', function (e) { btn.parentNode.classList.remove('expanded'); e.stopPropagation(); });
    };
    for (var _g = 0, _h = $all('.btn-collapse'); _g < _h.length; _g++) {
        var btn = _h[_g];
        _loop_2(btn);
    }
    var _loop_3 = function (btn) {
        btn.addEventListener('click', function () { showVideo(btn.getAttribute('data-id'), btn.getAttribute('data-filelink'), btn.getAttribute('data-weburl')); });
    };
    for (var _j = 0, _k = $all('.video_entry'); _j < _k.length; _j++) {
        var btn = _k[_j];
        _loop_3(btn);
    }
    var _loop_4 = function (tmb) {
        tmb.addEventListener('mouseenter', function () { onMouseEnterThumbnail(tmb); });
        tmb.addEventListener('mouseleave', function () { onMouseLeaveThumbnail(tmb); });
    };
    for (var _l = 0, _m = $all('.video_entry .thumbnail'); _l < _m.length; _l++) {
        var tmb = _m[_l];
        _loop_4(tmb);
    }
    $('title').textContent = data['meta']['htmltitle'];
    // noinspection JSIgnoredPromiseFromCall
    loadThumbnails();
}
function sortcompare(a, b, key) {
    var va = a.data.info[key];
    var vb = b.data.info[key];
    return sortcompareValues(va, vb);
}
function sortcompareData(a, b, key) {
    var va = a.data[key];
    var vb = b.data[key];
    return sortcompareValues(va, vb);
}
function sortcompareMeta(a, b, key) {
    var va = a.meta[key];
    var vb = b.meta[key];
    return sortcompareValues(va, vb);
}
function sortcompareValues(va, vb) {
    if (va === undefined && vb === undefined)
        return 0;
    if (va === undefined)
        return +1;
    if (vb === undefined)
        return -1;
    if (va === null && vb === null)
        return 0;
    if (va === null)
        return +1;
    if (vb === null)
        return -1;
    if (typeof va !== typeof vb)
        throw new Error('sortcompare type confusion (1)');
    if (typeof va === "number")
        return va - vb;
    if (typeof va === "string")
        return va.toLowerCase().localeCompare(vb.toLowerCase());
    if (Array.isArray(va) && Array.isArray(vb)) {
        if (va.length > 0 && vb.length > 0)
            return sortcompareValues(va[0], vb[0]);
        if (va.length > 0)
            return -1;
        if (vb.length > 0)
            return +1;
    }
    throw new Error('sortcompare type confusion (2)');
}
function sortcompareDiv(a, b, key1, key2) {
    var va1 = a.data.info[key1];
    var vb1 = b.data.info[key1];
    if (va1 === undefined && vb1 === undefined)
        return 0;
    if (va1 === undefined)
        return +1;
    if (vb1 === undefined)
        return -1;
    if (va1 === null && vb1 === null)
        return 0;
    if (va1 === null)
        return +1;
    if (vb1 === null)
        return -1;
    var va2 = a.data.info[key2];
    var vb2 = b.data.info[key2];
    if (va2 === undefined && vb2 === undefined)
        return 0;
    if (va2 === undefined)
        return +1;
    if (vb2 === undefined)
        return -1;
    if (va2 === null && vb2 === null)
        return 0;
    if (va2 === null)
        return +1;
    if (vb2 === null)
        return -1;
    if (typeof va1 !== "number")
        throw new Error('sortcompareDiv type confusion (a1)');
    if (typeof vb1 !== "number")
        throw new Error('sortcompareDiv type confusion (b1)');
    if (typeof va2 !== "number")
        throw new Error('sortcompareDiv type confusion (a2)');
    if (typeof vb2 !== "number")
        throw new Error('sortcompareDiv type confusion (b2)');
    return sortcompareValues(va1 / va2, vb1 / vb2);
}
function loadThumbnails() {
    DATA.thumbnailInvocationCounter++;
    var mode = parseInt($attr('.btn-loadthumbnails', 'data-mode'));
    if (mode === 0) {
        unloadThumbnails();
    }
    else if (mode === 1) {
        DATA.isLoadingThumbnails = true;
        loadThumbnailsIntelligentAsync()["finally"](function () { return DATA.isLoadingThumbnails = false; });
    }
    else if (mode === 2) {
        DATA.isLoadingThumbnails = true;
        loadThumbnailsSequentialAsync()["finally"](function () { return DATA.isLoadingThumbnails = false; });
    }
    else if (mode === 3) {
        DATA.isLoadingThumbnails = true;
        loadThumbnailsParallelAsync()["finally"](function () { return DATA.isLoadingThumbnails = false; });
    }
}
function unloadThumbnails() {
    for (var _i = 0, _a = $all('.thumb_img_loadable'); _i < _a.length; _i++) {
        var thumb = _a[_i];
        if (thumb.getAttribute('data-loaded') === '0')
            continue;
        thumb.setAttribute('data-loaded', '0');
        thumb.setAttribute('src', '/thumb_empty.svg');
    }
}
function loadThumbnailsIntelligentAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var ctr, _loop_5, _i, _a, thumb, state_1, _b, _c, thumb, src, ok;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    ctr = DATA.thumbnailInvocationCounter;
                    _loop_5 = function (thumb) {
                        if (DATA.thumbnailInvocationCounter !== ctr)
                            return { value: void 0 };
                        if (thumb.getAttribute('data-loaded') === '1')
                            return "continue";
                        if (!isElementInViewport(thumb))
                            return "continue"; // not visible
                        var src = thumb.getAttribute('data-realurl');
                        setImageSource(thumb, src).then(function (ok) {
                            if (!ok)
                                thumb.setAttribute('src', '/thumb_empty.svg');
                            thumb.setAttribute('data-loaded', '1');
                        });
                    };
                    // in-viewport => parallel
                    for (_i = 0, _a = $all('.thumb_img_loadable'); _i < _a.length; _i++) {
                        thumb = _a[_i];
                        state_1 = _loop_5(thumb);
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                    }
                    _b = 0, _c = $all('.thumb_img_loadable');
                    _d.label = 1;
                case 1:
                    if (!(_b < _c.length)) return [3 /*break*/, 5];
                    thumb = _c[_b];
                    if (DATA.thumbnailInvocationCounter !== ctr)
                        return [2 /*return*/];
                    if (thumb.getAttribute('data-loaded') === '1')
                        return [3 /*break*/, 4];
                    src = thumb.getAttribute('data-realurl');
                    return [4 /*yield*/, setImageSource(thumb, src)];
                case 2:
                    ok = _d.sent();
                    if (!ok)
                        thumb.setAttribute('src', '/thumb_empty.svg');
                    thumb.setAttribute('data-loaded', '1');
                    return [4 /*yield*/, sleepAsync(1)];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _b++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadThumbnailsSequentialAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var ctr, _i, _a, thumb, src, ok;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ctr = DATA.thumbnailInvocationCounter;
                    _i = 0, _a = $all('.thumb_img_loadable');
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    thumb = _a[_i];
                    if (DATA.thumbnailInvocationCounter !== ctr)
                        return [2 /*return*/];
                    if (thumb.getAttribute('data-loaded') === '1')
                        return [3 /*break*/, 4];
                    if (!isElementInViewport(thumb))
                        return [3 /*break*/, 4]; // not visible
                    src = thumb.getAttribute('data-realurl');
                    return [4 /*yield*/, setImageSource(thumb, src)];
                case 2:
                    ok = _b.sent();
                    if (!ok)
                        thumb.setAttribute('src', '/thumb_empty.svg');
                    thumb.setAttribute('data-loaded', '1');
                    return [4 /*yield*/, sleepAsync(1)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadThumbnailsParallelAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var ctr, _loop_6, _i, _a, thumb, state_2;
        return __generator(this, function (_b) {
            ctr = DATA.thumbnailInvocationCounter;
            _loop_6 = function (thumb) {
                if (DATA.thumbnailInvocationCounter !== ctr)
                    return { value: void 0 };
                if (thumb.getAttribute('data-loaded') === '1')
                    return "continue";
                if (!isElementInViewport(thumb))
                    return "continue"; // not visible
                var src = thumb.getAttribute('data-realurl');
                setImageSource(thumb, src).then(function (ok) {
                    if (!ok)
                        thumb.setAttribute('src', '/thumb_empty.svg');
                    thumb.setAttribute('data-loaded', '1');
                });
            };
            for (_i = 0, _a = $all('.thumb_img_loadable'); _i < _a.length; _i++) {
                thumb = _a[_i];
                state_2 = _loop_6(thumb);
                if (typeof state_2 === "object")
                    return [2 /*return*/, state_2.value];
            }
            return [2 /*return*/];
        });
    });
}
function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight));
}
function sleepAsync(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function setImageSource(image, src) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var resolved = false;
                    image.onload = function () {
                        if (resolved)
                            return;
                        resolved = true;
                        image.onload = null;
                        image.onerror = null;
                        resolve(true);
                    };
                    image.onerror = function () {
                        if (resolved)
                            return;
                        resolved = true;
                        image.onload = null;
                        image.onerror = null;
                        resolve(false);
                    };
                    image.src = src;
                })];
        });
    });
}
function initButtons() {
    var _this = this;
    $('.btn-display').addEventListener('click', function () {
        var current = parseInt($attr('.btn-display', 'data-mode'));
        var options = JSON.parse($attr('.btn-display', 'data-options'));
        showOptionDropDown('display', current, options, [], function (v) {
            $('.btn-display').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            updateDisplaymodeClass(true);
            loadThumbnails();
        });
    });
    $('.btn-width').addEventListener('click', function () {
        var current = parseInt($attr('.btn-width', 'data-mode'));
        var options = JSON.parse($attr('.btn-width', 'data-options'));
        showOptionDropDown('width', current, options, [], function (v) {
            $('.btn-width').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            updateDisplaywidthClass(true);
            loadThumbnails();
        });
    });
    $('.btn-order').addEventListener('click', function () {
        var current = parseInt($attr('.btn-order', 'data-mode'));
        var options = JSON.parse($attr('.btn-order', 'data-options'));
        var disabled = [];
        if (!JSON.parse(DATA.data).meta.has_ext_order) {
            disabled.push(7);
            disabled.push(8);
        }
        showOptionDropDown('order', current, options, disabled, function (v) {
            if (v === 9)
                DATA.shuffle_seed = Math.random().toString().replace(/[.,]/g, '').substr(1);
            $('.btn-order').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            initData(JSON.parse(DATA.data));
        });
    });
    $('.btn-loadthumbnails').addEventListener('click', function () {
        var current = parseInt($attr('.btn-loadthumbnails', 'data-mode'));
        var options = JSON.parse($attr('.btn-loadthumbnails', 'data-options'));
        showOptionDropDown('loadthumbnails', current, options, [], function (v) {
            $('.btn-loadthumbnails').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            loadThumbnails();
        });
    });
    $('.btn-videomode').addEventListener('click', function () {
        var current = parseInt($attr('.btn-videomode', 'data-mode'));
        var options = JSON.parse($attr('.btn-videomode', 'data-options'));
        var disabled = [];
        if ($attr('main', 'data-has_ffmpeg').toLowerCase() === 'false')
            disabled.push(3);
        showOptionDropDown('videomode', current, options, disabled, function (v) {
            $('.btn-videomode').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            updateVideomodeClass();
            var curr = $('#fullsizevideo');
            if (curr !== null)
                showVideo(curr.getAttribute("data-id"), curr.getAttribute("data-filelink"), curr.getAttribute("data-weburl"));
        });
    });
    $('.btn-theme').addEventListener('click', function () {
        var current = parseInt($attr('.btn-theme', 'data-mode'));
        var options = JSON.parse($attr('.btn-theme', 'data-options'));
        showOptionDropDown('theme', current, options, [], function (v) {
            $('.btn-theme').setAttribute('data-mode', v.toString());
            showToast(options[v]);
            updateLocationHash();
            updateTheme(true);
        });
    });
    $('.btn-refresh').addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    showToast('Refreshing data');
                    $('#content').innerHTML = '';
                    return [4 /*yield*/, $ajax('GET', '/data/' + DATA.dataidx + '/refresh')];
                case 1:
                    response = _a.sent();
                    if (response.success && response.status >= 200 && response.status < 400) {
                        DATA.data = response.body;
                        initData(JSON.parse(DATA.data));
                        showToast('Data refreshed');
                    }
                    else {
                        showToast('Could not load data');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    var apm = $('.apppath.multiple');
    if (apm !== null) {
        apm.addEventListener('click', function () {
            if ($('#apppath_dropdown.hidden') !== null)
                showPathDropDown();
            else
                hidePathDropDown();
        });
        var _loop_7 = function (row) {
            row.addEventListener('click', function () {
                hidePathDropDown();
                if (DATA.dataidx !== parseInt(row.getAttribute('data-idx'))) {
                    $('.apppath span').innerHTML = escapeHtml(row.getAttribute('data-name'));
                    DATA.dataidx = parseInt(row.getAttribute('data-idx'));
                    updateLocationHash();
                    loadDataFromServer(false);
                }
            });
        };
        for (var _i = 0, _a = $all('#apppath_dropdown .row'); _i < _a.length; _i++) {
            var row = _a[_i];
            _loop_7(row);
        }
    }
}
function updateLocationHash() {
    var hash = [];
    if ($attr('.btn-display', 'data-mode') !== $attr('.btn-display', 'data-initial'))
        hash.push('display=' + $attr('.btn-display', 'data-mode'));
    if ($attr('.btn-order', 'data-mode') !== $attr('.btn-order', 'data-initial'))
        hash.push('order=' + $attr('.btn-order', 'data-mode'));
    if ($attr('.btn-order', 'data-mode') === '9')
        hash.push('seed=' + DATA.shuffle_seed);
    if ($attr('.btn-width', 'data-mode') !== $attr('.btn-width', 'data-initial'))
        hash.push('width=' + $attr('.btn-width', 'data-mode'));
    if ($attr('.btn-loadthumbnails', 'data-mode') !== $attr('.btn-loadthumbnails', 'data-initial'))
        hash.push('thumb=' + $attr('.btn-loadthumbnails', 'data-mode'));
    if ($attr('.btn-videomode', 'data-mode') !== $attr('.btn-videomode', 'data-initial'))
        hash.push('videomode=' + $attr('.btn-videomode', 'data-mode'));
    if ($attr('.btn-theme', 'data-mode') !== $attr('.btn-theme', 'data-initial'))
        hash.push('theme=' + $attr('.btn-theme', 'data-mode'));
    if (DATA.dataidx !== parseInt($attr('.apppath', 'data-initial')))
        hash.push('dir=' + DATA.dataidx);
    location.hash = hash.join('&');
}
function updateDisplaymodeClass(toast) {
    var main = $('#content');
    var mode = parseInt($attr('.btn-display', 'data-mode'));
    main.classList.remove('lstyle_detailed');
    main.classList.remove('lstyle_grid');
    main.classList.remove('lstyle_x2');
    main.classList.remove('lstyle_compact');
    main.classList.remove('lstyle_tabular');
    if (mode === 0) {
        main.classList.add('lstyle_grid');
        if (toast)
            showToast('ListStyle: Grid');
    }
    if (mode === 1) {
        main.classList.add('lstyle_compact');
        if (toast)
            showToast('ListStyle: Compact');
    }
    if (mode === 2) {
        main.classList.add('lstyle_tabular');
        if (toast)
            showToast('ListStyle: Tabular');
    }
    if (mode === 3) {
        main.classList.add('lstyle_detailed');
        if (toast)
            showToast('ListStyle: Detailed');
    }
    if (mode === 4) {
        main.classList.add('lstyle_grid', 'lstyle_x2');
        if (toast)
            showToast('ListStyle: Grid (x2)');
    }
}
function updateDisplaywidthClass(toast) {
    var content = $('#content');
    var mode = parseInt($attr('.btn-width', 'data-mode'));
    content.classList.remove('lstyle_width_small');
    content.classList.remove('lstyle_width_medium');
    content.classList.remove('lstyle_width_wide');
    content.classList.remove('lstyle_width_full');
    if (mode === 0) {
        content.classList.add('lstyle_width_small');
        if (toast)
            showToast('Width: Small');
    }
    if (mode === 1) {
        content.classList.add('lstyle_width_medium');
        if (toast)
            showToast('Width: Medium');
    }
    if (mode === 2) {
        content.classList.add('lstyle_width_wide');
        if (toast)
            showToast('Width: Wide');
    }
    if (mode === 3) {
        content.classList.add('lstyle_width_full');
        if (toast)
            showToast('Width: Full');
    }
}
function updateTheme(toast) {
    var mode = $attr('.btn-theme', 'data-mode');
    var new_theme = '/themes/' + mode;
    if ($attr('#theme_style_obj', 'href') !== new_theme)
        $('#theme_style_obj').setAttribute('href', new_theme);
}
function updateVideomodeClass() {
    var content = $('#content');
    var mode = parseInt($attr('.btn-videomode', 'data-mode'));
    for (var i = 0; i < 10; i++)
        content.classList.remove('lstyle_videomode_' + i);
    content.classList.add('lstyle_videomode_' + mode);
}
function initEvents() {
    window.addEventListener('scroll', function () { loadThumbnails(); });
    $('#dropdown_background').addEventListener('click', function () {
        hideAllDropDowns();
    });
}
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
function removeVideo() {
    var vid = $('#fullsizevideo');
    if (vid === null)
        return;
    var videlem = vid.querySelector('video');
    videlem.pause();
    videlem.removeAttribute('src');
    videlem.load();
    vid.parentNode.removeChild(vid);
}
function showVideo(id, filelink, url) {
    var old = $('#fullsizevideo');
    if (old !== null)
        removeVideo();
    var mode = parseInt($('.btn-videomode').getAttribute('data-mode'));
    if (mode === 0)
        return;
    if (mode === 1 || mode === 2 || mode === 3) {
        var html = '';
        html += '<div id="fullsizevideo" data-id="' + escapeHtml(id) + '" data-filelink="' + escapeHtml(filelink) + '" data-weburl="' + escapeHtml(url) + '">';
        html += '  <div class="vidcontainer">';
        html += '    <video width="320" height="240" controls autoplay>';
        if (mode === 1)
            html += '<source src="/data/' + DATA.dataidx + '/video/' + escapeHtml(id) + '/seek">';
        if (mode === 2)
            html += '<source src="/data/' + DATA.dataidx + '/video/' + escapeHtml(id) + '/file">';
        if (mode === 3)
            html += '<source src="/data/' + DATA.dataidx + '/video/' + escapeHtml(id) + '/stream" type="video/webm">';
        html += '    </video>';
        html += '  </div>';
        html += '</div>';
        var main = $('#root');
        main.insertBefore(htmlToElement(html), main.firstChild);
        var fsv = $('#fullsizevideo');
        fsv.addEventListener('click', function () { removeVideo(); });
        return;
    }
    if (mode === 4) {
        window.open('/data/' + DATA.dataidx + '/video/' + escapeHtml(id) + '/file', '_blank').focus();
        return;
    }
    if (mode === 5) {
        window.open('vlc://' + window.location.protocol + "//" + window.location.host + '/data/' + DATA.dataidx + '/video/' + escapeHtml(id) + '/seek', '_self');
        return;
    }
    if (mode === 6) {
        window.open('vlc://' + filelink, '_self');
        return;
    }
    if (mode === 7) {
        window.open(url, '_blank');
        return;
    }
}
function clearToast() {
    $('#toast').classList.add('vanished');
}
function showToast(txt) {
    clearTimeout(DATA.toastTimeoutID);
    var toaster = $('#toast');
    toaster.innerText = txt;
    toaster.classList.add('vanished');
    toaster.classList.remove('active');
    DATA.toastTimeoutID = setTimeout(clearToast, 2000);
    setTimeout(function () { toaster.classList.remove('vanished'); toaster.classList.add('active'); }, 10);
}
function hideAllDropDowns() {
    hidePathDropDown();
    hideOptionDropDown();
    $('#dropdown_background').classList.add('hidden');
}
function showPathDropDown() {
    hideAllDropDowns();
    var img = $('.apppath i');
    img.classList.remove('fa-chevron-down');
    img.classList.add('fa-chevron-up');
    $('#apppath_dropdown').classList.remove('hidden');
    $('#dropdown_background').classList.remove('hidden');
}
function hidePathDropDown() {
    var img = $('.apppath i');
    img.classList.add('fa-chevron-down');
    img.classList.remove('fa-chevron-up');
    $('#apppath_dropdown').classList.add('hidden');
    $('#dropdown_background').classList.add('hidden');
}
function showOptionDropDown(type, current, options, disabledids, lambda) {
    var dd = $('#option_dropdown');
    if (dd.getAttribute('data-ddtype') === type) {
        hideAllDropDowns();
        return;
    }
    hideAllDropDowns();
    var ids = [];
    var html = '';
    for (var i = 0; i < options.length; i++) {
        if (disabledids.includes(i))
            continue;
        var elemid = 'drow_' + (DATA.dropDownIDCounter++);
        var cls = 'row';
        if (i === current)
            cls += ' active';
        html += '<div id="' + elemid + '" class="' + cls + '" data-value="' + escapeHtml(options[i]) + '" data-idx="' + i + '">' + escapeHtml(options[i]) + '</div>';
        ids.push(elemid);
    }
    dd.innerHTML = html;
    dd.classList.remove('hidden');
    dd.setAttribute('data-ddtype', type);
    var _loop_8 = function (id) {
        var elem = $('#' + id);
        elem.addEventListener('click', function () {
            hideOptionDropDown();
            lambda(parseInt(elem.getAttribute('data-idx')));
        });
    };
    for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
        var id = ids_1[_i];
        _loop_8(id);
    }
    $('#dropdown_background').classList.remove('hidden');
}
function hideOptionDropDown() {
    $('#option_dropdown').classList.add('hidden');
    $('#option_dropdown').setAttribute('data-ddtype', 'none');
    $('#dropdown_background').classList.add('hidden');
}
function onMouseEnterThumbnail(elem) {
    return __awaiter(this, void 0, void 0, function () {
        var content, img, video_id, response, c;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    content = $('#content');
                    if (parseInt($attr('.btn-loadthumbnails', 'data-mode')) === 0)
                        return [2 /*return*/];
                    if ($attr('main', 'data-has_ffmpeg').toLowerCase() === 'false')
                        return [2 /*return*/];
                    if ($attr('main', 'data-has_cache').toLowerCase() === 'false')
                        return [2 /*return*/];
                    if (!content.classList.contains('lstyle_grid') && !content.classList.contains('lstyle_detailed'))
                        return [2 /*return*/];
                    img = elem.querySelector('img');
                    if (img.getAttribute('data-loaded') !== '1')
                        return [2 /*return*/];
                    video_id = img.getAttribute('data-videoid');
                    DATA.currentAnimatedPreview = video_id;
                    return [4 /*yield*/, $ajax('GET', '/data/' + DATA.dataidx + '/video/' + video_id + '/prev/' + 0)];
                case 1:
                    response = _a.sent();
                    if (!(response.success && response.status >= 200 && response.status < 400)) return [3 /*break*/, 3];
                    c = parseInt(response.headers['previewimagecount']);
                    return [4 /*yield*/, animateThumbnailPreview(img, c, video_id)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    console.error('Could not load preview images (status)');
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function animateThumbnailPreview(img, max, video_id) {
    return __awaiter(this, void 0, void 0, function () {
        var i, t;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 1;
                    _a.label = 1;
                case 1:
                    if (DATA.currentAnimatedPreview !== video_id)
                        return [2 /*return*/];
                    t = performance.now();
                    return [4 /*yield*/, setImageSource(img, '/data/' + DATA.dataidx + '/video/' + video_id + '/prev/' + (i % max))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, sleepAsync(Math.max(0, 333 - (performance.now() - t)))];
                case 3:
                    _a.sent();
                    if (!(((i + 1) % max) === 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, sleepAsync(666)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function onMouseLeaveThumbnail(elem) {
    var img = elem.querySelector('img');
    if (img.getAttribute('data-loaded') !== '1')
        return;
    var video_id = img.getAttribute('data-videoid');
    if (DATA.currentAnimatedPreview !== video_id) {
        DATA.currentAnimatedPreview = '';
        return;
    }
    DATA.currentAnimatedPreview = '';
    img.src = img.getAttribute('data-realurl');
}
