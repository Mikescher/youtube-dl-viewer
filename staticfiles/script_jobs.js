
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

function sleepAsync(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.onload = async function()
{
    for(;;)
    {
        await refresh();
        await sleepAsync(100);
    }
};


async function refresh()
{
    const linelen = Math.floor(document.querySelector('#root').clientWidth / document.querySelector('#font_test').clientWidth);


    const response = await $ajax('GET', '/jobmanager/list');

    if (!response.success || !(response.status >= 200 && response.status < 400)) { console.error.log('Could not refresh'); return; }

    const data = JSON.parse(response.body)

    let text = "";

    text += ("Active: " + data.Meta.CountActive).padEnd(linelen - 30, ' ') + "<span class=\"btn\">[Force generate all previews]</span>" + "\n";
    text += ("Queued: " + data.Meta.CountQueued).padEnd(linelen - 29, ' ') + "<span class=\"btn\">[Force transcode all videos]</span>" + "\n";
    text += "\n";

    const progressLen = linelen - (14+40+10+10+8);
    text += "<span class=\"header\">" + ("Type").padEnd(14, ' ') + ("Name").padEnd(40, ' ') + ("Proxies").padEnd(10, ' ') + ("State").padEnd(10, ' ') + ("Progress").padEnd(progressLen, ' ') + ("Time").padEnd(8, ' ') + "</span>" + "\n";
    for (const job of data.Jobs)
    {
        const col1 = (job.ManagerName).padEnd(14, ' ');
        const col2 = "<span class=\"maxlen\" data-len=\"38\" data-text=\""+escapeHtml(job.Name)+"\">" + escapeHtml(job.Name.substr(0, 38).padEnd(40, ' ')) + "</span>";
        const col3 = ("" + job.ProxyCount).padEnd(10, ' ');
        const col4 = (job.State).padEnd(10, ' ');
        const col5 = "[" + ("#").padEnd(Math.ceil((progressLen-4) * job.Progress), '#').padEnd(progressLen-4, ' ') + "]" + "  ";
        const col6 = job.Time;

        text += [col1, col2, col3, col4, col5, col6].join("") + "\n";
    }

    $('#root').innerHTML = text;
}