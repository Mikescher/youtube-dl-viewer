"use strict";
function getModeEnabled(key, idx) {
    return !JSON.parse($attr('#options', 'data-disabled-' + key)).includes(idx);
}
function optEnabled(v) {
    return v.enabledGlobal && v.enabledPerDir && v.enabledByLogic;
}
class VideoListModel {
    // ----------------------------------------
    constructor(optionsource) {
        this.Values_DisplayMode = [
            { index: 0, text: "ListStyle: Grid", keys: ['grid', '0'], enabledGlobal: getModeEnabled('displaymode', 0), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_grid'], renderer: new DisplayGridRenderer('grid') },
            { index: 1, text: "ListStyle: Compact", keys: ['compact', '1'], enabledGlobal: getModeEnabled('displaymode', 1), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_compact'], renderer: new DisplayCompactRenderer() },
            { index: 2, text: "ListStyle: Tabular", keys: ['tabular', '2'], enabledGlobal: getModeEnabled('displaymode', 2), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_tabular'], renderer: new DisplayTabularRenderer() },
            { index: 3, text: "ListStyle: Detailed", keys: ['detailed', '3'], enabledGlobal: getModeEnabled('displaymode', 3), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_detailed'], renderer: new DisplayDetailedRenderer() },
            { index: 4, text: "ListStyle: Grid (x2)", keys: ['gridx2', '4'], enabledGlobal: getModeEnabled('displaymode', 4), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_grid', 'lstyle_x2'], renderer: new DisplayGridRenderer('gridx2') },
            { index: 5, text: "ListStyle: Grid (1/2)", keys: ['grid_half', '5'], enabledGlobal: getModeEnabled('displaymode', 5), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_grid', 'lstyle_half'], renderer: new DisplayGridRenderer('grid_half') },
            { index: 6, text: "ListStyle: Timeline", keys: ['timeline', '6'], enabledGlobal: getModeEnabled('displaymode', 6), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_timeline'], renderer: new DisplayTimelineRenderer() },
        ];
        this.Values_WidthMode = [
            { index: 0, text: "Width: Small", keys: ['small', '0'], enabledGlobal: getModeEnabled('widthmode', 0), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_width_small'] },
            { index: 1, text: "Width: Medium", keys: ['medium', '1'], enabledGlobal: getModeEnabled('widthmode', 1), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_width_medium'] },
            { index: 2, text: "Width: Wide", keys: ['wide', '2'], enabledGlobal: getModeEnabled('widthmode', 2), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_width_wide'] },
            { index: 3, text: "Width: Full", keys: ['full', '3'], enabledGlobal: getModeEnabled('widthmode', 3), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_width_full'] },
        ];
        this.Values_OrderMode = [
            { index: 0, text: "Sorting: Date [descending]", keys: ['date-desc', '0'], enabledGlobal: getModeEnabled('ordermode', 0), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompare(a, b, 'upload_date') * -1) },
            { index: 1, text: "Sorting: Date [ascending]", keys: ['date-asc', '1'], enabledGlobal: getModeEnabled('ordermode', 1), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompare(a, b, 'upload_date') * +1) },
            { index: 2, text: "Sorting: Title", keys: ['title', '2'], enabledGlobal: getModeEnabled('ordermode', 2), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompareData(a, b, 'title')) },
            { index: 3, text: "Sorting: Category", keys: ['category', '3'], enabledGlobal: getModeEnabled('ordermode', 3), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompare(a, b, 'categories')) },
            { index: 4, text: "Sorting: Views", keys: ['views', '4'], enabledGlobal: getModeEnabled('ordermode', 4), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompare(a, b, 'view_count')) },
            { index: 5, text: "Sorting: Rating", keys: ['rating', '5'], enabledGlobal: getModeEnabled('ordermode', 5), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompareDiv(a, b, 'like_count', 'dislike_count') * -1) },
            { index: 6, text: "Sorting: Uploader", keys: ['uploader', '6'], enabledGlobal: getModeEnabled('ordermode', 6), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompare(a, b, 'uploader')) },
            { index: 7, text: "Sorting: External [descending]", keys: ['external-desc', '7'], enabledGlobal: getModeEnabled('ordermode', 7), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompareMeta(a, b, 'ext_order_index') * -1) },
            { index: 8, text: "Sorting: External [ascending]", keys: ['external-asc', '8'], enabledGlobal: getModeEnabled('ordermode', 8), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompareMeta(a, b, 'ext_order_index') * +1) },
            { index: 9, text: "Sorting: Random", keys: ['random', '9'], enabledGlobal: getModeEnabled('ordermode', 9), enabledPerDir: false, enabledByLogic: true, sort: (p) => { shuffle(p, new SeedRandom(this.shuffle_seed)); return p; } },
            { index: 10, text: "Sorting: Filename [ascending]", keys: ['filename-asc', '10'], enabledGlobal: getModeEnabled('ordermode', 10), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompareMeta(a, b, 'filename_base') * +1) },
            { index: 11, text: "Sorting: Filename [descending]", keys: ['filename-desc', '11'], enabledGlobal: getModeEnabled('ordermode', 11), enabledPerDir: false, enabledByLogic: true, sort: (p) => p.sort((a, b) => CompareUtil.sortcompareMeta(a, b, 'filename_base') * -1) },
        ];
        this.Values_ThumbnailMode = [
            { index: 0, text: "Thumbnails: Off", keys: ['off', '0'], enabledGlobal: getModeEnabled('thumbnailmode', 0), enabledPerDir: false, enabledByLogic: true, start: (m, id) => m.unloadAll(id), restartOnScroll: false },
            { index: 1, text: "Thumbnails: On (intelligent)", keys: ['intelligent', '1'], enabledGlobal: getModeEnabled('thumbnailmode', 1), enabledPerDir: false, enabledByLogic: true, start: (m, id) => m.startLoadingIntelligent(id), restartOnScroll: true },
            { index: 2, text: "Thumbnails: On (sequential)", keys: ['sequential', '2'], enabledGlobal: getModeEnabled('thumbnailmode', 2), enabledPerDir: false, enabledByLogic: true, start: (m, id) => m.startLoadingSequential(id), restartOnScroll: true },
            { index: 3, text: "Thumbnails: On (parallel)", keys: ['parallel', '3'], enabledGlobal: getModeEnabled('thumbnailmode', 3), enabledPerDir: false, enabledByLogic: true, start: (m, id) => m.startLoadingParallel(id), restartOnScroll: true },
        ];
        this.Values_VideoMode = [
            { index: 0, text: "Playback: Disabled", keys: ['disabled', '0'], enabledGlobal: getModeEnabled('videomode', 0), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_0', 'lstyle_videomode_disabled',], play: (_) => { } },
            { index: 1, text: "Playback: Seekable raw file", keys: ['raw-seekable', '1'], enabledGlobal: getModeEnabled('videomode', 1), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_1', 'lstyle_videomode_raw-seekable',], play: (v) => App.PLAYER.showStreamplayer(v, 'seek') },
            { index: 2, text: "Playback: Raw file", keys: ['raw', '2'], enabledGlobal: getModeEnabled('videomode', 2), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_2', 'lstyle_videomode_raw',], play: (v) => App.PLAYER.showStreamplayer(v, 'file') },
            { index: 3, text: "Playback: Transcoded Webm stream", keys: ['transcoded', '3'], enabledGlobal: getModeEnabled('videomode', 3), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_3', 'lstyle_videomode_transcoded',], play: (v) => App.PLAYER.showStreamplayer(v, 'stream') },
            { index: 4, text: "Playback: Download file", keys: ['download', '4'], enabledGlobal: getModeEnabled('videomode', 4), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_4', 'lstyle_videomode_download',], play: (v) => App.PLAYER.openFile(v) },
            { index: 5, text: "Playback: VLC Protocol Link (stream)", keys: ['vlc-stream', '5'], enabledGlobal: getModeEnabled('videomode', 5), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_5', 'lstyle_videomode_vlc-stream',], play: (v) => App.PLAYER.openVLCStream(v) },
            { index: 6, text: "Playback: VLC Protocol Link (local)", keys: ['vlc-local', '6'], enabledGlobal: getModeEnabled('videomode', 6), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_6', 'lstyle_videomode_vlc-local',], play: (v) => App.PLAYER.openVLC(v) },
            { index: 7, text: "Playback: Open original Webpage", keys: ['url', '7'], enabledGlobal: getModeEnabled('videomode', 7), enabledPerDir: false, enabledByLogic: true, css: ['lstyle_videomode_7', 'lstyle_videomode_url',], play: (v) => App.PLAYER.openURL(v) },
        ];
        this.Values_Themes = [
        // ... dynamic: { text: "..", keys: [..] }
        ];
        this.Values_DataDirs = [
        // ... dynamic: { text: "..", keys: [..], url: ".." }
        ];
        // ----------------------------------------
        this.displaymode_globdefault = -1;
        this.displaymode_current = -1;
        this.widthmode_globdefault = -1;
        this.widthmode_current = -1;
        this.ordermode_globdefault = -1;
        this.ordermode_current = -1;
        this.thumbnailmode_globdefault = -1;
        this.thumbnailmode_current = -1;
        this.videomode_globdefault = -1;
        this.videomode_current = -1;
        this.theme_globdefault = -1;
        this.theme_current = -1;
        this.datadir_default = -1;
        this.datadir_current = -1;
        // ----------------------------------------
        this.shuffle_seed = Math.random().toString().replace(/[.,]/g, '').substr(1);
        this.startup_play = null;
        this.current_data = null;
        this.current_videolist = null;
        this.data_loadid_counter = 10000;
        this.current_data_loadid = null;
        this.dom_content = $('#content');
        this.dom_theme_style_obj = $('#theme_style_obj');
        this.Values_Themes = JSON.parse(optionsource.getAttribute('data-themelist'));
        this.Values_DataDirs = JSON.parse(optionsource.getAttribute('data-dirlist'));
        this.hasFFMPEG = (optionsource.getAttribute('data-has_ffmpeg').toLowerCase() === 'true');
        this.hasCache = (optionsource.getAttribute('data-has_cache').toLowerCase() === 'true');
        this.preview_config_mincount = parseInt(optionsource.getAttribute('data-previewcount-config-min'));
        this.preview_config_maxcount = parseInt(optionsource.getAttribute('data-previewcount-config-max'));
        this.Values_VideoMode[3].enabledByLogic = this.hasFFMPEG; // Transcoded Webm stream
        this.Values_DisplayMode[6].enabledByLogic = this.hasFFMPEG && this.hasCache; // Timeline
        this.displaymode_current = this.displaymode_globdefault = this.getIndexFromKey("DisplayMode", this.Values_DisplayMode, optionsource.getAttribute('data-displaymode'), null);
        this.widthmode_current = this.widthmode_globdefault = this.getIndexFromKey("WidthMode", this.Values_WidthMode, optionsource.getAttribute('data-widthmode'), null);
        this.ordermode_current = this.ordermode_globdefault = this.getIndexFromKey("OrderMode", this.Values_OrderMode, optionsource.getAttribute('data-ordermode'), null);
        this.thumbnailmode_current = this.thumbnailmode_globdefault = this.getIndexFromKey("ThumbnailMode", this.Values_ThumbnailMode, optionsource.getAttribute('data-thumbnailmode'), null);
        this.videomode_current = this.videomode_globdefault = this.getIndexFromKey("VideoMode", this.Values_VideoMode, optionsource.getAttribute('data-videomode'), null);
        this.theme_current = this.theme_globdefault = this.getIndexFromKey("Theme", this.Values_Themes, optionsource.getAttribute('data-theme'), null);
        this.datadir_current = this.datadir_default = this.getIndexFromKey("DataDir", this.Values_DataDirs, optionsource.getAttribute('data-dir'), null);
    }
    init() {
        for (const e of location.hash.replace('#', '').split('&')) {
            const [key, val] = e.split('=');
            if (key === 'display')
                this.displaymode_current = this.getIndexFromKey("DisplayMode", this.Values_DisplayMode, val, this.getDefaultDisplayMode());
            if (key === 'width')
                this.widthmode_current = this.getIndexFromKey("WidthMode", this.Values_WidthMode, val, this.getDefaultWidthMode());
            if (key === 'order')
                this.ordermode_current = this.getIndexFromKey("OrderMode", this.Values_OrderMode, val, this.getDefaultOrderMode());
            if (key === 'thumb')
                this.thumbnailmode_current = this.getIndexFromKey("ThumbnailMode", this.Values_ThumbnailMode, val, this.getDefaultThumbnailMode());
            if (key === 'videomode')
                this.videomode_current = this.getIndexFromKey("VideoMode", this.Values_VideoMode, val, this.getDefaultVideoMode());
            if (key === 'theme')
                this.theme_current = this.getIndexFromKey("Theme", this.Values_Themes, val, this.getDefaultTheme());
            if (key === 'dir')
                this.datadir_current = this.getIndexFromKey("DataDir", this.Values_DataDirs, val, this.getDefaultDataDir());
            if (key === 'seed')
                this.shuffle_seed = val;
            if (key === 'play')
                this.startup_play = this.parsePlayValue(val);
        }
        if (this.startup_play != null)
            this.datadir_current = this.startup_play[0];
        this.updateThemeStylesheet();
        App.UI.initPathDropdownWidth();
        this.loadData(true).then(() => { if (this.startup_play != null)
            App.PLAYER.showVideo(this.startup_play[1]); });
    }
    parsePlayValue(v) {
        const idx = v.indexOf('::');
        if (idx < 0)
            return null;
        const p1 = v.substr(0, idx);
        const p2 = v.substr(idx + 2);
        const num = this.getIndexFromKey("DataDir", this.Values_DataDirs, p1, null);
        if (num === -1)
            return null;
        return [num, p2];
    }
    isLoaded() {
        return (this.current_data !== null);
    }
    async loadData(preclear) {
        this.current_data = null;
        this.current_videolist = null;
        App.THUMBS.stop();
        const loadid = this.data_loadid_counter++;
        this.current_data_loadid = loadid;
        try {
            if (preclear)
                this.dom_content.innerHTML = '';
            const response = await $ajax('GET', '/data/' + this.datadir_current + '/json');
            if (!response.success) {
                App.showToast('Could not load data');
                return;
            }
            const json = JSON.parse(response.body);
            if (this.current_data_loadid !== loadid) {
                console.warn("Abort no longer valid loadData Task (" + this.current_data_loadid + " <> " + loadid + ")");
                return;
            }
            await this.applyData(json, preclear);
        }
        catch (e) {
            App.showToast('Could not load data');
            console.error(e);
        }
    }
    async refreshAndLoadData() {
        const loadid = this.data_loadid_counter++;
        this.current_data_loadid = loadid;
        const btnRefreshIcon = $('.btn-refresh i');
        try {
            btnRefreshIcon.classList.add('fa-spin');
            const ts = Date.now();
            const response = await $ajax('GET', '/data/' + this.datadir_current + '/refresh');
            if (Date.now() - ts < 1000)
                await sleepAsync(Math.max(1000 - (Date.now() - ts), 0));
            if (!response.success) {
                App.showToast('Could not refresh data');
                return;
            }
            const json = JSON.parse(response.body);
            if (this.current_data_loadid !== loadid) {
                console.warn("Abort no longer valid refreshAndLoadData Task (" + this.current_data_loadid + " <> " + loadid + ")");
                return;
            }
            await this.applyData(json, true);
            App.showToast('Data reloaded from filesystem');
        }
        catch (e) {
            App.showToast('Could not refresh data');
            console.error(e);
        }
        finally {
            btnRefreshIcon.classList.remove('fa-spin');
        }
    }
    async applyData(json, preclear) {
        this.current_data = null;
        this.current_videolist = null;
        let vlist = new Map();
        for (const vid of json.videos) {
            vid.has = function (key) { return Object.hasOwnProperty.call(this, key); };
            vid.hasNonNull = function (key) { return this.has(key) && this[key] != null; };
            vid.hasArrayWithValues = function (key) { return this.hasNonNull(key) && Object.hasOwnProperty.call(this[key], 'length') && this[key].length > 0; };
            vid.data.info.has = function (key) { return Object.hasOwnProperty.call(this, key); };
            vid.data.info.hasNonNull = function (key) { return this.has(key) && this[key] != null; };
            vid.data.info.hasArrayWithValues = function (key) { return this.hasNonNull(key) && Object.hasOwnProperty.call(this[key], 'length') && this[key].length > 0; };
            vlist.set(vid.meta.uid, vid);
        }
        this.current_data = json;
        this.current_videolist = vlist;
        for (let v of this.Values_DisplayMode)
            v.enabledPerDir = !json.meta.order_disabled.includes(v.index);
        for (let v of this.Values_WidthMode)
            v.enabledPerDir = !json.meta.width_disabled.includes(v.index);
        for (let v of this.Values_OrderMode)
            v.enabledPerDir = !json.meta.order_disabled.includes(v.index);
        for (let v of this.Values_ThumbnailMode)
            v.enabledPerDir = !json.meta.thumbnail_disabled.includes(v.index);
        for (let v of this.Values_VideoMode)
            v.enabledPerDir = !json.meta.videomode_disabled.includes(v.index);
        for (let v of this.Values_Themes)
            v.enabledPerDir = !json.meta.theme_disabled.includes(v.name.toLowerCase());
        this.Values_OrderMode[7].enabledByLogic = json.meta.has_ext_order;
        this.Values_OrderMode[8].enabledByLogic = json.meta.has_ext_order;
        if (json.meta.display_override !== null)
            this.displaymode_current = json.meta.display_override;
        if (json.meta.width_override !== null)
            this.widthmode_current = json.meta.width_override;
        if (json.meta.order_override !== null)
            this.ordermode_current = json.meta.order_override;
        if (json.meta.thumbnail_override !== null)
            this.thumbnailmode_current = json.meta.thumbnail_override;
        if (json.meta.videomode_override !== null)
            this.videomode_current = json.meta.videomode_override;
        if (json.meta.theme_override !== null)
            this.theme_current = json.meta.theme_override;
        if (!optEnabled(this.getCurrentDisplayMode()))
            this.displaymode_current = this.getDefaultDisplayMode().index;
        if (!optEnabled(this.getCurrentWidthMode()))
            this.widthmode_current = this.getDefaultWidthMode().index;
        if (!optEnabled(this.getCurrentOrderMode()))
            this.ordermode_current = this.getDefaultOrderMode().index;
        if (!optEnabled(this.getCurrentThumbnailMode()))
            this.thumbnailmode_current = this.getDefaultThumbnailMode().index;
        if (!optEnabled(this.getCurrentVideoMode()))
            this.videomode_current = this.getDefaultVideoMode().index;
        if (!optEnabled(this.getCurrentTheme()))
            this.theme_current = this.getDefaultTheme().index;
        await this.recreateDOM(preclear);
        this.updateHash();
    }
    async recreateDOM(preclear) {
        if (this.current_data === null) {
            this.dom_content.innerHTML = '';
            App.THUMBS.stop();
            return;
        }
        App.THUMBS.stop();
        if (preclear)
            this.dom_content.innerHTML = '';
        await sleepAsync(0);
        let videos = this.current_data.videos;
        let meta = this.current_data.meta;
        videos = this.getCurrentOrderMode().sort(videos);
        let html = this.getCurrentDisplayMode().renderer.render(videos, meta, this.getCurrentDataDir());
        this.dom_content.classList.value = ''; // clear all classes
        this.dom_content.classList.add(...this.getCurrentVideoMode().css);
        this.dom_content.classList.add(...this.getCurrentDisplayMode().css);
        this.dom_content.classList.add(...this.getCurrentWidthMode().css);
        this.dom_content.innerHTML = html;
        $_('title').textContent = this.current_data.meta.htmltitle;
        this.getCurrentDisplayMode().renderer.initEvents();
        App.THUMBS.start();
    }
    getVideoByID(id) {
        var _a;
        if (this.current_videolist === null)
            return null;
        return (_a = this.current_videolist.get(id)) !== null && _a !== void 0 ? _a : null;
    }
    static getDefault(arr, ovr, glob) {
        if (ovr != null && ovr >= 0 && ovr < arr.length && optEnabled(arr[ovr]))
            return arr[ovr];
        if (optEnabled(arr[glob]))
            return arr[glob];
        for (const d of arr)
            if (optEnabled(d))
                return d;
        return arr[glob];
    }
    getDefaultDisplayMode() { var _a, _b; return VideoListModel.getDefault(this.Values_DisplayMode, (_b = (_a = this.current_data) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.display_override, this.displaymode_globdefault); }
    getDefaultWidthMode() { var _a, _b; return VideoListModel.getDefault(this.Values_WidthMode, (_b = (_a = this.current_data) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.width_override, this.widthmode_globdefault); }
    getDefaultOrderMode() { var _a, _b; return VideoListModel.getDefault(this.Values_OrderMode, (_b = (_a = this.current_data) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.order_override, this.ordermode_globdefault); }
    getDefaultThumbnailMode() { var _a, _b; return VideoListModel.getDefault(this.Values_ThumbnailMode, (_b = (_a = this.current_data) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.thumbnail_override, this.thumbnailmode_globdefault); }
    getDefaultVideoMode() { var _a, _b; return VideoListModel.getDefault(this.Values_VideoMode, (_b = (_a = this.current_data) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.videomode_override, this.videomode_globdefault); }
    getDefaultTheme() { var _a, _b; return VideoListModel.getDefault(this.Values_Themes, (_b = (_a = this.current_data) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.theme_override, this.theme_globdefault); }
    getDefaultDataDir() { return VideoListModel.getDefault(this.Values_DataDirs, null, this.datadir_default); }
    updateHash() {
        let hash = [];
        if (this.displaymode_current !== this.getDefaultDisplayMode().index)
            hash.push('display=' + this.getCurrentDisplayMode().keys[0]);
        if (this.widthmode_current !== this.getDefaultWidthMode().index)
            hash.push('width=' + this.getCurrentWidthMode().keys[0]);
        if (this.ordermode_current !== this.getDefaultOrderMode().index)
            hash.push('order=' + this.getCurrentOrderMode().keys[0]);
        if (this.thumbnailmode_current !== this.getDefaultThumbnailMode().index)
            hash.push('thumb=' + this.getCurrentThumbnailMode().keys[0]);
        if (this.videomode_current !== this.getDefaultVideoMode().index)
            hash.push('videomode=' + this.getCurrentVideoMode().keys[0]);
        if (this.theme_current !== this.getDefaultTheme().index)
            hash.push('theme=' + this.getCurrentTheme().keys[0]);
        if (this.datadir_current !== this.getDefaultDataDir().index)
            hash.push('dir=' + this.getCurrentDataDir().keys[0]);
        if (this.ordermode_current === 9)
            hash.push('seed=' + this.shuffle_seed);
        let strhash = hash.join('&');
        if (strhash === '') {
            // prevent jump to top when "clearing" hash
            if (window.history && window.history.replaceState) {
                window.history.replaceState('', '', window.location.pathname);
            }
            else {
                let [scrollV, scrollH] = [document.body.scrollTop, document.body.scrollLeft];
                location.hash = strhash;
                [document.body.scrollTop, document.body.scrollLeft] = [scrollV, scrollH];
            }
        }
        else {
            location.hash = strhash;
        }
    }
    getIndexFromKey(type, values, key, fallback) {
        var _a;
        for (const elem of values) {
            if (elem.keys.includes(key))
                return elem.index;
        }
        const err = "Invalid value '" + key + "' for type '" + type + "' using fallback '" + fallback + "'";
        console.warn(err);
        App.showToast(err);
        return (_a = fallback === null || fallback === void 0 ? void 0 : fallback.index) !== null && _a !== void 0 ? _a : 0;
    }
    setDisplayMode(key, showtoast = false) {
        const value = this.getIndexFromKey("DisplayMode", this.Values_DisplayMode, key.toString(), this.getDefaultDisplayMode());
        if (value === this.displaymode_current)
            return;
        this.displaymode_current = value;
        for (const v of this.Values_DisplayMode)
            this.dom_content.classList.remove(...v.css);
        this.dom_content.classList.add(...this.getCurrentDisplayMode().css);
        if (showtoast)
            App.showToast(this.getCurrentDisplayMode().text);
        this.updateHash();
        this.recreateDOM(false).then(() => { });
    }
    setWidthMode(key, showtoast = false) {
        const value = this.getIndexFromKey("WidthMode", this.Values_WidthMode, key.toString(), this.getDefaultWidthMode());
        if (value === this.widthmode_current)
            return;
        this.widthmode_current = value;
        for (const v of this.Values_WidthMode)
            this.dom_content.classList.remove(...v.css);
        this.dom_content.classList.add(...this.getCurrentWidthMode().css);
        if (showtoast)
            App.showToast(this.getCurrentWidthMode().text);
        this.updateHash();
        App.THUMBS.restart();
    }
    setOrderMode(key, showtoast = false, reshuffle = false) {
        const value = this.getIndexFromKey("OrderMode", this.Values_OrderMode, key.toString(), this.getDefaultOrderMode());
        if (value === this.ordermode_current && !(reshuffle && value === 9))
            return;
        this.ordermode_current = value;
        if (reshuffle)
            this.shuffle_seed = Math.random().toString().replace(/[.,]/g, '').substr(1);
        if (showtoast)
            App.showToast(this.getCurrentOrderMode().text);
        this.updateHash();
        this.recreateDOM(false).then(() => { });
    }
    setThumbnailMode(key, showtoast = false) {
        const value = this.getIndexFromKey("ThumbnailMode", this.Values_ThumbnailMode, key.toString(), this.getDefaultThumbnailMode());
        if (value === this.thumbnailmode_current)
            return;
        this.thumbnailmode_current = value;
        if (showtoast)
            App.showToast(this.getCurrentThumbnailMode().text);
        this.updateHash();
        App.THUMBS.restart();
    }
    setVideoMode(key, showtoast = false) {
        const value = this.getIndexFromKey("VideoMode", this.Values_VideoMode, key.toString(), this.getDefaultVideoMode());
        if (value === this.videomode_current)
            return;
        this.videomode_current = value;
        for (const v of this.Values_VideoMode)
            this.dom_content.classList.remove(...v.css);
        this.dom_content.classList.add(...this.getCurrentVideoMode().css);
        if (showtoast)
            App.showToast(this.getCurrentVideoMode().text);
        this.updateHash();
    }
    setTheme(key, showtoast = false) {
        const value = this.getIndexFromKey("Theme", this.Values_Themes, key.toString(), this.getDefaultTheme());
        if (value === this.theme_current)
            return;
        this.theme_current = value;
        this.updateThemeStylesheet();
        if (showtoast)
            App.showToast(this.getCurrentTheme().text);
        this.updateHash();
    }
    setDataDir(key, showtoast = false) {
        const value = this.getIndexFromKey("DataDir", this.Values_DataDirs, key.toString(), this.getDefaultDataDir());
        if (value === this.datadir_current)
            return;
        this.datadir_current = value;
        if (showtoast)
            App.showToast(this.getCurrentDataDir().text);
        App.UI.refreshPathCombobox();
        this.updateHash();
        this.loadData(true).then(() => { });
    }
    updateThemeStylesheet() {
        let evt = () => {
            this.dom_theme_style_obj.removeEventListener('load', evt);
            App.UI.initPathDropdownWidth();
        };
        this.dom_theme_style_obj.addEventListener('load', evt);
        this.dom_theme_style_obj.setAttribute('href', this.getCurrentTheme().url);
    }
    getCurrentDisplayMode() { return this.Values_DisplayMode[this.displaymode_current]; }
    getCurrentWidthMode() { return this.Values_WidthMode[this.widthmode_current]; }
    getCurrentOrderMode() { return this.Values_OrderMode[this.ordermode_current]; }
    getCurrentThumbnailMode() { return this.Values_ThumbnailMode[this.thumbnailmode_current]; }
    getCurrentVideoMode() { return this.Values_VideoMode[this.videomode_current]; }
    getCurrentTheme() { return this.Values_Themes[this.theme_current]; }
    getCurrentDataDir() { return this.Values_DataDirs[this.datadir_current]; }
}
