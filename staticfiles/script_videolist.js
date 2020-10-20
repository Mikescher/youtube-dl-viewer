class VideoListModel {
    //isLoadingThumbnails = false;
    //
    //current_data = null;
    //
    //thumbnailInvocationCounter = 0;
    //currentAnimatedPreview = '';
    // ----------------------------------------
    constructor(optionsource) {
        this.Values_DisplayMode = [
            { text: "ListStyle: Grid", keys: ['grid', '0'], enabled: true, css: ['lstyle_grid'] },
            { text: "ListStyle: Compact", keys: ['compact', '1'], enabled: true, css: ['lstyle_compact'] },
            { text: "ListStyle: Tabular", keys: ['tabular', '2'], enabled: true, css: ['lstyle_tabular'] },
            { text: "ListStyle: Detailed", keys: ['detailed', '3'], enabled: true, css: ['lstyle_detailed'] },
            { text: "ListStyle: Grid (x2)", keys: ['gridx2', '4'], enabled: true, css: ['lstyle_grid', 'lstyle_x2'] },
        ];
        this.Values_OrderMode = [
            { text: "Sorting: Date [descending]", keys: ['date-desc', '0'], enabled: true },
            { text: "Sorting: Date [ascending]", keys: ['date-asc', '1'], enabled: true },
            { text: "Sorting: Title", keys: ['title', '2'], enabled: true },
            { text: "Sorting: Category", keys: ['cat', '3'], enabled: true },
            { text: "Sorting: Views", keys: ['views', '4'], enabled: true },
            { text: "Sorting: Rating", keys: ['rating', '5'], enabled: true },
            { text: "Sorting: Uploader", keys: ['uploader', '6'], enabled: true },
            { text: "Sorting: External [descending]", keys: ['ext-desc', '7'], enabled: true },
            { text: "Sorting: External [ascending]", keys: ['ext-asc', '8'], enabled: true },
            { text: "Sorting: Random", keys: ['rand', '9'], enabled: true },
            { text: "Sorting: Filename [ascending]", keys: ['filename-asc', '10'], enabled: true },
            { text: "Sorting: Filename [descending]", keys: ['filename-desc', '11'], enabled: true },
        ];
        this.Values_WidthMode = [
            { text: "Width: Small", keys: ['small', '0'], enabled: true, css: ['lstyle_width_small'] },
            { text: "Width: Medium", keys: ['medium', '1'], enabled: true, css: ['lstyle_width_medium'] },
            { text: "Width: Wide", keys: ['wide', '2'], enabled: true, css: ['lstyle_width_wide'] },
            { text: "Width: Full", keys: ['full', '3'], enabled: true, css: ['lstyle_width_full'] },
        ];
        this.Values_ThumbnailMode = [
            { text: "Thumbnails: Off", keys: ['off', '0'], enabled: true },
            { text: "Thumbnails: On (intelligent)", keys: ['intelligent', '1'], enabled: true },
            { text: "Thumbnails: On (sequential)", keys: ['sequential', '2'], enabled: true },
            { text: "Thumbnails: On (parallel)", keys: ['parallel', '3'], enabled: true },
        ];
        this.Values_VideoMode = [
            { text: "Playback: Disabled", keys: ['disabled', '0'], enabled: true, css: ['lstyle_videomode_0', 'lstyle_videomode_disabled',] },
            { text: "Playback: Seekable raw file", keys: ['raw-seekable', '1'], enabled: true, css: ['lstyle_videomode_1', 'lstyle_videomode_raw-seekable',] },
            { text: "Playback: Raw file", keys: ['raw', '2'], enabled: true, css: ['lstyle_videomode_2', 'lstyle_videomode_raw',] },
            { text: "Playback: Transcoded Webm stream", keys: ['transcoded', '3'], enabled: true, css: ['lstyle_videomode_3', 'lstyle_videomode_transcoded',] },
            { text: "Playback: Download file", keys: ['download', '4'], enabled: true, css: ['lstyle_videomode_4', 'lstyle_videomode_download',] },
            { text: "Playback: VLC Protocol Link (stream)", keys: ['vlc-stream', '5'], enabled: true, css: ['lstyle_videomode_5', 'lstyle_videomode_vlc-stream',] },
            { text: "Playback: VLC Protocol Link (local)", keys: ['vlc-local', '6'], enabled: true, css: ['lstyle_videomode_6', 'lstyle_videomode_vlc-local',] },
            { text: "Playback: Open original Webpage", keys: ['url', '7'], enabled: true, css: ['lstyle_videomode_7', 'lstyle_videomode_url',] },
        ];
        this.Values_Themes = [
        // ... dynamic: { text: "..", keys: [..] }
        ];
        this.Values_DataDirs = [
        // ... dynamic: { text: "..", keys: [..], url: ".." }
        ];
        // ----------------------------------------
        this.displaymode_default = -1;
        this.displaymode_current = -1;
        this.ordermode_default = -1;
        this.ordermode_current = -1;
        this.widthmode_default = -1;
        this.widthmode_current = -1;
        this.thumbnailmode_default = -1;
        this.thumbnailmode_current = -1;
        this.videomode_default = -1;
        this.videomode_current = -1;
        this.theme_default = -1;
        this.theme_current = -1;
        this.datadir_default = -1;
        this.datadir_current = -1;
        this.shuffle_seed = Math.random().toString().replace(/[.,]/g, '').substr(1);
        this.content = $('#content');
        this.Values_Themes = JSON.parse(optionsource.getAttribute('data-themelist'));
        this.Values_DataDirs = JSON.parse(optionsource.getAttribute('data-dirlist'));
        this.Values_VideoMode[3].enabled = (optionsource.getAttribute('data-has_ffmpeg').toLowerCase() === 'true');
        this.displaymode_current = this.displaymode_default = this.getIndexFromKey("DisplayMode", this.Values_DisplayMode, optionsource.getAttribute('data-displaymode'), 0);
        this.ordermode_current = this.ordermode_default = this.getIndexFromKey("OrderMode", this.Values_OrderMode, optionsource.getAttribute('data-ordermode'), 0);
        this.widthmode_current = this.widthmode_default = this.getIndexFromKey("WidthMode", this.Values_WidthMode, optionsource.getAttribute('data-widthmode'), 0);
        this.thumbnailmode_current = this.thumbnailmode_default = this.getIndexFromKey("ThumbnailMode", this.Values_ThumbnailMode, optionsource.getAttribute('data-thumbnailmode'), 0);
        this.videomode_current = this.videomode_default = this.getIndexFromKey("VideoMode", this.Values_VideoMode, optionsource.getAttribute('data-videomode'), 0);
        this.theme_current = this.theme_default = this.getIndexFromKey("Theme", this.Values_Themes, optionsource.getAttribute('data-theme'), 0);
        this.datadir_current = this.datadir_default = this.getIndexFromKey("DataDir", this.Values_DataDirs, optionsource.getAttribute('data-dir'), 0);
    }
    init() {
        for (const e of location.hash.replace('#', '').split('&')) {
            const [key, val] = e.split('=');
            if (key === 'display')
                this.displaymode_current = this.getIndexFromKey("DisplayMode", this.Values_DisplayMode, val, this.displaymode_default);
            if (key === 'order')
                this.ordermode_current = this.getIndexFromKey("OrderMode", this.Values_OrderMode, val, this.ordermode_default);
            if (key === 'width')
                this.widthmode_current = this.getIndexFromKey("WidthMode", this.Values_WidthMode, val, this.widthmode_default);
            if (key === 'thumb')
                this.thumbnailmode_current = this.getIndexFromKey("ThumbnailMode", this.Values_ThumbnailMode, val, this.thumbnailmode_default);
            if (key === 'videomode')
                this.videomode_current = this.getIndexFromKey("VideoMode", this.Values_VideoMode, val, this.videomode_default);
            if (key === 'theme')
                this.theme_current = this.getIndexFromKey("Theme", this.Values_Themes, val, this.theme_default);
            if (key === 'dir')
                this.datadir_current = this.getIndexFromKey("DataDir", this.Values_DataDirs, val, this.datadir_default);
            if (key === 'seed')
                this.shuffle_seed = val;
        }
        this.loadData();
    }
    loadData() {
        this.Values_OrderMode[7].enabled = /* TODO */ true;
        this.Values_OrderMode[7].enabled = /* TODO */ true;
    }
    recreateDOM() {
    }
    updateHash() {
        let hash = [];
        if (this.displaymode_current !== this.displaymode_default)
            hash.push('display=' + this.displaymode_current);
        if (this.ordermode_current !== this.ordermode_default)
            hash.push('order=' + this.ordermode_current);
        if (this.widthmode_current !== this.widthmode_default)
            hash.push('width=' + this.widthmode_current);
        if (this.thumbnailmode_current !== this.thumbnailmode_default)
            hash.push('thumb=' + this.thumbnailmode_current);
        if (this.videomode_current !== this.videomode_default)
            hash.push('videomode=' + this.videomode_current);
        if (this.theme_current !== this.theme_default)
            hash.push('theme=' + this.theme_current);
        if (this.datadir_current !== this.datadir_default)
            hash.push('dir=' + this.datadir_current);
        if (this.ordermode_current === 9)
            hash.push('seed=' + this.shuffle_seed);
        location.hash = hash.join('&');
    }
    getIndexFromKey(type, values, key, fallback) {
        for (let i = 0; i < values.length; i++) {
            if (values[i].keys.includes(key))
                return i;
        }
        const err = "Invalid value '" + key + "' for type '" + type + "' using fallback '" + fallback + "'";
        console.warn(err);
        App.showToast(err);
        return fallback;
    }
    setDisplayMode(key, showtoast = false) {
        const value = this.getIndexFromKey("DisplayMode", this.Values_DisplayMode, key.toString(), this.displaymode_default);
        if (value === this.displaymode_current)
            return;
        this.displaymode_current = value;
        for (const v of this.Values_DisplayMode)
            this.content.classList.remove(...v.css);
        this.content.classList.add(...this.Values_DisplayMode[this.displaymode_current].css);
        if (showtoast)
            App.showToast(this.Values_DisplayMode[value].text);
        this.updateHash();
    }
    setOrderMode(key, showtoast = false) {
        const value = this.getIndexFromKey("OrderMode", this.Values_OrderMode, key.toString(), this.ordermode_default);
        if (value === this.ordermode_current)
            return;
        this.ordermode_current = value;
        if (showtoast)
            App.showToast(this.Values_OrderMode[value].text);
        this.updateHash();
        this.recreateDOM();
    }
    setWidthMode(key, showtoast = false) {
        const value = this.getIndexFromKey("WidthMode", this.Values_WidthMode, key.toString(), this.widthmode_default);
        if (value === this.widthmode_current)
            return;
        this.widthmode_current = value;
        for (const v of this.Values_WidthMode)
            this.content.classList.remove(...v.css);
        this.content.classList.add(...this.Values_WidthMode[this.displaymode_current].css);
        if (showtoast)
            App.showToast(this.Values_WidthMode[value].text);
        this.updateHash();
    }
    setThumbnailMode(key, showtoast = false) {
        const value = this.getIndexFromKey("ThumbnailMode", this.Values_ThumbnailMode, key.toString(), this.thumbnailmode_default);
        if (value === this.thumbnailmode_current)
            return;
        this.thumbnailmode_current = value;
        if (showtoast)
            App.showToast(this.Values_WidthMode[value].text);
        this.updateHash();
        //TODO
    }
    setVideoMode(key, showtoast = false) {
        const value = this.getIndexFromKey("VideoMode", this.Values_VideoMode, key.toString(), this.videomode_default);
        if (value === this.videomode_current)
            return;
        this.videomode_current = value;
        for (const v of this.Values_VideoMode)
            this.content.classList.remove(...v.css);
        this.content.classList.add(...this.Values_VideoMode[this.videomode_current].css);
        if (showtoast)
            App.showToast(this.Values_VideoMode[value].text);
        this.updateHash();
    }
    setTheme(key, showtoast = false) {
        const value = this.getIndexFromKey("Theme", this.Values_Themes, key.toString(), this.theme_default);
        if (value === this.theme_current)
            return;
        this.theme_current = value;
        let new_theme = this.Values_Themes[value].url;
        $('#theme_style_obj').setAttribute('href', new_theme);
        if (showtoast)
            App.showToast(this.Values_Themes[value].text);
        this.updateHash();
    }
    setDataDir(key, showtoast = false) {
        const value = this.getIndexFromKey("DataDir", this.Values_DataDirs, key.toString(), this.datadir_default);
        if (value === this.datadir_current)
            return;
        this.datadir_current = value;
        if (showtoast)
            App.showToast(this.Values_DataDirs[value].text);
        App.USERINTERFACE.refreshPathCombobox();
        this.updateHash();
        this.loadData();
    }
    getCurrentDisplayMode() { return this.Values_DisplayMode[this.displaymode_current]; }
    getCurrentOrderMode() { return this.Values_OrderMode[this.ordermode_current]; }
    getCurrentWidthMode() { return this.Values_WidthMode[this.widthmode_current]; }
    getCurrentThumbnailMode() { return this.Values_ThumbnailMode[this.thumbnailmode_current]; }
    getCurrentVideoMode() { return this.Values_VideoMode[this.videomode_current]; }
    getCurrentTheme() { return this.Values_Themes[this.theme_current]; }
    getCurrentDataDir() { return this.Values_DataDirs[this.datadir_current]; }
}
