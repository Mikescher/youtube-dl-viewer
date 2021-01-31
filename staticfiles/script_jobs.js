"use strict";
/*
    [ youtube-dl-viewer <jobview> ]
*/
const DATA = {
    last_json: '',
    last_text_head: '',
    last_text_content: '',
    last_job_concat: '',
    last_job_texts: {},
};
window.onload = async function () {
    for (;;) {
        try {
            await refresh();
        }
        catch (e) {
            console.error('Exception in refresh(): ' + e);
            await unfresh();
        }
        await sleepAsync(100);
    }
};
async function refresh() {
    const dom_html = $('html');
    const dom_root = $('#root');
    const dom_font_test = $('#font_test');
    const linelen = Math.max(110, Math.floor(dom_root.clientWidth / dom_font_test.clientWidth));
    const progressLen = linelen - (22 + 14 + 50 + 10 + 10 + 8 + 7);
    const response = await $ajax('GET', '/jobmanager/list');
    if (!response.success || !(response.status >= 200 && response.status < 400)) {
        console.error('Could not refresh');
        await unfresh();
        return;
    }
    dom_html.classList.remove('unfresh');
    if (DATA.last_json === '') {
        dom_root.innerHTML =
            '<div id="root_head" class="meta"></div>' +
                '<div id="root_content" class="meta"></div>';
    }
    if ((linelen + ";" + response.body) === DATA.last_json)
        return;
    DATA.last_json = (linelen + ";" + response.body);
    const data = JSON.parse(response.body);
    let text_head = "";
    text_head += ("Active Jobs: " + data.Meta.Jobs.CountActive).padEnd(linelen - 34, ' ') + " <span id=\"btnForceGenPreviews\" class=\"btn btn-action\">[Force generate missing previews]</span>" + "\n";
    text_head += ("Queued Jobs: " + data.Meta.Jobs.CountQueued).padEnd(linelen - 33, ' ') + " <span id=\"btnForceTranscode\" class=\"btn btn-action\">[Force transcode missing videos]</span>" + "\n";
    text_head += (("Cached Previews:                " + ("" + data.Meta.Videos.CountCachedPreviews).padStart(3, " ") + " / " + data.Meta.Videos.CountTotal).padEnd(44, ' ') + "( " + formatBytes(data.Meta.Videos.FilesizeCachedPreviews).padStart(8, ' ') + " )").padEnd(linelen - 22, ' ') + " <span id=\"btnClearFinished\" class=\"btn btn-action\">[Clear finished jobs]</span>" + "\n";
    text_head += (("Cached Videos (webm transcode): " + ("" + data.Meta.Videos.CountCachedVideos).padStart(3, " ") + " / " + data.Meta.Videos.CountTotal).padEnd(44, ' ') + "( " + formatBytes(data.Meta.Videos.FilesizeCachedVideos).padStart(8, ' ') + " )").padEnd(linelen - 17, ' ') + " <span id=\"btnAbortAll\" class=\"btn btn-danger\">[Abort all jobs]</span>" + "\n";
    text_head += "\n";
    text_head += "<span class=\"header\">" + ("Timestamp (Start)").padEnd(22, ' ') + ("Type").padEnd(14, ' ') + ("Name").padEnd(50, ' ') + ("Proxies").padEnd(10, ' ') + ("State").padEnd(10, ' ') + ("Progress").padEnd(progressLen, ' ') + ("Time").padEnd(8, ' ') + ("Actions").padEnd(7, ' ') + "</span>" + "\n";
    if (DATA.last_text_head !== (linelen + ";" + text_head)) {
        DATA.last_text_head = (linelen + ";" + text_head);
        $('#root_head').innerHTML = text_head;
        updateEvents_Head();
    }
    let job_concat = '';
    for (const job of data.Jobs)
        job_concat += job.ID;
    if (DATA.last_job_concat !== job_concat) {
        DATA.last_job_concat = job_concat;
        DATA.last_job_texts = {};
        let html_jobs_shell = '';
        for (const job of data.Jobs)
            html_jobs_shell += '<div id="jobshell_' + job.ID + '" class="meta"></div>';
        $('#root_content').innerHTML = html_jobs_shell;
    }
    for (const job of data.Jobs) {
        let error_tt = '';
        //if (job.Error !== null) error_tt = "data-tooltip=\"" + escapeHtml(job.Error) + "\" data-attached=\"0\"";
        if (job.Error !== null)
            error_tt = " title=\"" + escapeHtml(job.Error) + "\" ";
        const col0 = (job.StartTimeStr).padEnd(22, ' ');
        const col1 = (job.ManagerName).padEnd(14, ' ');
        const col2 = "<span class=\"maxlen\" style=\"max-width: 48ch\">" + escapeHtml(job.Name.padEnd(50, ' ')) + "</span>" + "  ";
        const col3 = (("" + job.ProxyCount).padStart(2, ' ') + " / " + ("" + job.ProxyRequests).padStart(2, ' ')).padEnd(10, ' ');
        const col4 = "<span class=\"statecol state_" + job.State + "\" " + error_tt + ">" + (job.State).padEnd(10, ' ') + "</span>";
        const col5 = "[<span class=\"colProgress\">" + ("").padEnd(Math.floor((progressLen - 4) * job.Progress), '#').padEnd(progressLen - 4, ' ') + "</span>]" + "  ";
        const col6 = ("" + job.Time).padEnd(8, ' ');
        const col7 = "<span class=\"btnAbort btn " + (job.AbortRequest ? "btn-warn" : "btn-danger") + "\" data-jobid=\"" + job.ID + "\">[Abort]</span>";
        const job_content = "<span class=\"job state_" + job.State + " queue_" + job.QueueName + " abort_" + job.AbortRequest + "\">" + [col0, col1, col2, col3, col4, col5, col6, col7].join("") + "</span>" + "\n";
        if (!DATA.last_job_texts.hasOwnProperty(job.ID) || DATA.last_job_texts[job.ID] !== job_content) {
            DATA.last_job_texts[job.ID] = job_content;
            $('#jobshell_' + job.ID).innerHTML = job_content;
            const btn = $('#jobshell_' + job.ID + ' .btnAbort');
            btn.addEventListener('click', async (_) => {
                await $ajax('GET', '/jobmanager/abort/' + btn.getAttribute('data-jobid'));
            });
        }
    }
}
async function unfresh() {
    $('html').classList.add('unfresh');
}
function updateEvents_Head() {
    $('#btnForceGenPreviews').addEventListener('click', async (_) => {
        if ($('#root').classList.contains('unfresh'))
            return;
        await $ajax('GET', '/jobmanager/start/generatePreviews/*/*');
    });
    $('#btnForceTranscode').addEventListener('click', async (_) => {
        if ($('#root').classList.contains('unfresh'))
            return;
        await $ajax('GET', '/jobmanager/start/generateTranscode/*/*');
    });
    $('#btnClearFinished').addEventListener('click', async (_) => {
        if ($('#root').classList.contains('unfresh'))
            return;
        await $ajax('GET', '/jobmanager/clearFinished');
    });
    $('#btnAbortAll').addEventListener('click', async (_) => {
        if ($('#root').classList.contains('unfresh'))
            return;
        await $ajax('GET', '/jobmanager/abort/*');
    });
}
