"use strict";
function $(sel) {
    return document.querySelector(sel);
}
function $_(sel) {
    return document.querySelector(sel);
}
function $all(sel) {
    return Array.prototype.slice.apply(document.querySelectorAll(sel));
}
function $_all(sel) {
    return toArr(document.querySelectorAll(sel));
}
function $attr(sel, attr) {
    var _a, _b;
    return (_b = (_a = document.querySelector(sel)) === null || _a === void 0 ? void 0 : _a.getAttribute(attr)) !== null && _b !== void 0 ? _b : null;
}
function $ajax(method, url) {
    return new Promise(resolve => {
        const request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = function () {
            let headerMap = new Map();
            request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(function (line) { const parts = line.split(': '); const header = parts.shift(); headerMap.set(header.toLowerCase(), parts.join(': ')); });
            resolve({ success: true, status: this.status, statusText: this.statusText, body: this.response, headers: headerMap });
        };
        request.onerror = function () {
            resolve({ success: false, status: null, statusText: null, body: null, headers: null });
        };
        request.send();
    });
}
function toArr(v) {
    return Array.prototype.slice.apply(v);
}
function escapeHtml(text) {
    if (typeof text !== "string")
        text = ("" + text).toString();
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
function formatSeconds(sec) {
    if (sec <= 60)
        return sec + 's';
    const ohou = Math.floor(sec / (60 * 60));
    sec -= ohou * 60 * 60;
    const omin = Math.floor(sec / 60);
    sec -= omin * 60;
    const osec = Math.floor(sec);
    if (ohou > 0)
        return ohou + 'h ' + omin + 'min ' + osec + 's';
    else
        return omin + 'min ' + osec + 's';
}
function formatDate(date) {
    return date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);
}
function formatNumber(num) {
    num = num + '';
    let rex = /(\d+)(\d{3})/;
    while (rex.test(num))
        num = num.replace(rex, '$1' + '.' + '$2');
    return num;
}
function shuffle(a, srand) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(srand.double() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function setImageSource(image, src) {
    return new Promise(resolve => {
        let resolved = false;
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
    });
}
function htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight));
}
function isInParentBounds(el) {
    const rect = el.getBoundingClientRect();
    const bounds = el.parentElement.getBoundingClientRect();
    if (rect.right <= bounds.left)
        return false;
    if (rect.bottom <= bounds.top)
        return false;
    if (rect.left >= bounds.right)
        return false;
    if (rect.top >= bounds.bottom)
        return false;
    return true;
}
function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0)
        return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}
function extEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16); });
}
