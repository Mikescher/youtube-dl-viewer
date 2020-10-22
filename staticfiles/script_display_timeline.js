"use strict";
class DisplayTimelineRenderer {
    render(videos, dir) {
        let html = '';
        for (const vid of videos) {
            let ve_cls = 'video_entry';
            if (vid.meta.cached)
                ve_cls += ' webm-cached';
            if (vid.meta.cached_previews)
                ve_cls += ' preview-cached';
            html += '<div class="' + ve_cls + '" data-id="' + escapeHtml(vid.meta.uid) + '">';
            html += '<div class="title">' + escapeHtml(vid.data.title) + '</div>';
            if (vid.data.info.hasNonNull('upload_date'))
                html += '<div class="upload_date">' + escapeHtml(formatDate(vid.data.info.upload_date)) + '</div>';
            html += '<div class="timeline" data-datadirindex="' + dir.index + '" data-videoid="' + vid.meta.uid + '">';
            for (let i = 0; i < App.VIDEOLIST.preview_config_maxcount; i++) {
                if (i === 0)
                    html += '<div class="thumbnail timeline_thumb timeline_first"><div class="thumbnail_img"><img class="thumb_img_loadable" src="/thumb_empty.svg" alt="thumbnail" data-loaded="0" data-realurl="/data/' + dir.index + '/video/' + escapeHtml(vid.meta.uid) + '/thumb" data-videoid="' + escapeHtml(vid.meta['uid']) + '" /></div></div>';
                else
                    html += '<div class="thumbnail timeline_thumb"><div class="thumbnail_img"><img src="/thumb_empty.svg" alt="thumbnail" data-loaded="0" data-realurl="/data/' + dir.index + '/video/' + escapeHtml(vid.meta.uid) + '/prev/' + i + '" /></div></div>';
            }
            html += '</div>';
            html += '</div>';
            html += "\n\n";
        }
        return html;
    }
    async setThumbnail(thumb) {
        const dom_timeline = thumb.parentElement.parentElement.parentElement;
        const all_images = toArr(dom_timeline.querySelectorAll(".timeline_thumb img"));
        const images = all_images.filter(p => isInParentBounds(p.parentElement.parentElement));
        const images_hidden = all_images.filter(p => !isInParentBounds(p.parentElement.parentElement));
        if (images.every(p => p.getAttribute('data-loaded') === '1') && images_hidden.every(p => p.getAttribute('data-loaded') === '0'))
            return true;
        let datadirindex = dom_timeline.getAttribute('data-datadirindex');
        let videoid = dom_timeline.getAttribute('data-videoid');
        const response = await $ajax('GET', '/data/' + datadirindex + '/video/' + escapeHtml(videoid) + '/prev/' + 0);
        if (!response.success || response.status < 200 || response.status > 400) {
            console.error('Could not load preview images (status)');
            return false;
        }
        const prevcount = parseInt(response.headers.get('previewimagecount'));
        for (const himg of images_hidden) {
            himg.setAttribute('src', '/thumb_empty.svg');
            himg.setAttribute('data-loaded', '0');
        }
        if (prevcount <= images.length) {
            let allok = true;
            for (let i = 0; i < images.length; i++) {
                if (i < prevcount) {
                    const src = '/data/' + datadirindex + '/video/' + escapeHtml(videoid) + '/prev/' + i;
                    images[i].parentElement.parentElement.classList.remove('hidden');
                    const ok = await setImageSource(images[i], src).then(ok => {
                        if (!ok)
                            images[i].setAttribute('src', '/thumb_empty.svg');
                        images[i].setAttribute('data-loaded', ok ? '1' : '0');
                        return ok;
                    });
                    if (!ok)
                        allok = false;
                }
                else {
                    images[i].parentElement.parentElement.classList.add('hidden');
                }
            }
            return allok;
        }
        else {
            let allok = true;
            for (let i = 0; i < images.length; i++) {
                const prev = Math.floor(((prevcount - 1) * i) / (images.length - 1));
                const src = '/data/' + datadirindex + '/video/' + escapeHtml(videoid) + '/prev/' + prev;
                images[i].parentElement.parentElement.classList.remove('hidden');
                const ok = await setImageSource(images[i], src).then(ok => {
                    if (!ok)
                        images[i].setAttribute('src', '/thumb_empty.svg');
                    images[i].setAttribute('data-loaded', ok ? '1' : '0');
                    return ok;
                });
                if (!ok)
                    allok = false;
            }
            return allok;
        }
    }
    async unsetThumbnail(thumb) {
        const dom_timeline = thumb.parentElement.parentElement.parentElement;
        for (const img of toArr(dom_timeline.querySelectorAll(".timeline_thumb img"))) {
            img.setAttribute('src', '/thumb_empty.svg');
            img.setAttribute('data-loaded', '0');
        }
    }
    initEvents() {
        for (const btn of $all('.video_entry'))
            btn.addEventListener('click', () => { App.PLAYER.showVideo(btn.getAttribute('data-id')); });
    }
}
