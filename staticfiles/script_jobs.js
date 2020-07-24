const DATA =
{
    last_json: '',
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

function sleepAsync(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.onload = async function()
{
    for(;;)
    {
        try { await refresh(); } catch (e) { }
        await sleepAsync(100);
    }
};


async function refresh()
{
    const linelen = Math.floor(document.querySelector('#root').clientWidth / document.querySelector('#font_test').clientWidth);


    const response = await $ajax('GET', '/jobmanager/list');

    if (!response.success || !(response.status >= 200 && response.status < 400)) { console.error('Could not refresh'); return; }

    if ((linelen + ";" + response.body) === DATA.last_json) return;
    DATA.last_json = (linelen + ";" + response.body);

    const data = JSON.parse(response.body)

    let text = "";

    text += ("Active: " + data.Meta.CountActive).padEnd(linelen - 30, ' ') + " <span id=\"btnForceGenPreviews\" class=\"btn\">[Force generate all previews]</span>" + "\n";
    text += ("Queued: " + data.Meta.CountQueued).padEnd(linelen - 29, ' ') + " <span id=\"btnForceTranscode\" class=\"btn\">[Force transcode all videos]</span>" + "\n";
    text += ("").padEnd(linelen - 22, ' ')                                 + " <span id=\"btnClearFinished\" class=\"btn\">[Clear finished jobs]</span>" + "\n";
    text += "\n";

    const progressLen = linelen - (14+50+10+10+8+7);
    text += "<span class=\"header\">" + ("Type").padEnd(14, ' ') + ("Name").padEnd(50, ' ') + ("Proxies").padEnd(10, ' ') + ("State").padEnd(10, ' ') + ("Progress").padEnd(progressLen, ' ') + ("Time").padEnd(8, ' ') + ("Actions").padEnd(7, ' ') + "</span>" + "\n";
    for (const job of data.Jobs)
    {
        const col1 = (job.ManagerName).padEnd(14, ' ');
        const col2 = "<span class=\"maxlen\" style=\"max-width: 48ch\">" + escapeHtml(job.Name.padEnd(50, ' ')) + "</span>" + "  ";
        const col3 = (("" + job.ProxyCount).padStart(2, ' ') + " / " + ("" + job.ProxyRequests).padStart(2, ' ')).padEnd(10, ' ');
        const col4 = "<span class=\"statecol state_"+job.State+"\">" + (job.State).padEnd(10, ' ')+"</span>";
        const col5 = "[<span class=\"colProgress\">" + ("").padEnd(Math.floor((progressLen-4) * job.Progress), '#').padEnd(progressLen-4, ' ') + "</span>]" + "  ";
        const col6 = ("" + job.Time).padEnd(8, ' ');
        const col7 = "<span class=\"btnAbort\" data-jobid=\""+job.ID+"\">[Abort]</span>";

        text += "<span class=\"job state_"+job.State+" queue_"+job.QueueName+" abort_"+job.AbortRequest+"\">" + [col1, col2, col3, col4, col5, col6, col7].join("") + "</span>" + "\n";
    }

    $('#root').innerHTML = text;
    
    updateEvents();
}

function updateEvents()
{
    $('#btnForceGenPreviews').addEventListener('click', async e =>
    {
        await $ajax('GET', '/jobmanager/start/generatePreviews/*/*')
    });

    $('#btnForceTranscode').addEventListener('click', async e =>
    {
        await $ajax('GET', '/jobmanager/start/generateTranscode/*/*')
    });

    $('#btnClearFinished').addEventListener('click', async e =>
    {
        await $ajax('GET', '/jobmanager/clearFinished')
    });

    for(const btn of $all('.btnAbort'))
    {
        btn.addEventListener('click', async e =>
        {
            await $ajax('GET', '/jobmanager/abort/' + btn.getAttribute('data-jobid'));
        });
    }
    
}



