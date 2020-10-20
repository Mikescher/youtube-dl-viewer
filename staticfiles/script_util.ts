
interface AjaxResult { success: boolean; status: number; statusText: string; body: string; headers: Map<string, string> }

function $(sel): HTMLElement
{ 
    return document.querySelector<HTMLElement>(sel); 
}
function $all(sel): NodeListOf<HTMLElement> 
{ 
    return document.querySelectorAll<HTMLElement>(sel); 
}
function $attr(sel, attr): string 
{ 
    return document.querySelector(sel).getAttribute(attr); 
}
function $ajax(method, url): Promise<AjaxResult>
{
    return new Promise(resolve =>
    {
        const request = new XMLHttpRequest();
        request.open(method, url, true);

        request.onload  = function()
        {
            let headerMap = new Map<string, string>();
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




