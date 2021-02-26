"use strict";
window.onload = async function () {
    await CacheStatusController.refresh();
};
class CacheStatusController {
    static async refresh() {
        var _a, _b;
        const dom_root = $('#root');
        const response = await $ajax('GET', '/state/cache');
        if (!response.success || !(response.status >= 200 && response.status < 400)) {
            console.error('Could not refresh');
            dom_root.innerHTML = '(ERROR)';
            return;
        }
        const data = JSON.parse(response.body);
        let frappeconfig = {};
        frappeconfig['columns'] =
            [
                { 'name': "Filename", 'editable': false, 'width': 550 },
                { 'name': "Used", 'editable': false, 'width': 50 },
                { 'name': "CDate", 'editable': false, 'width': 150 },
                { 'name': "MDate", 'editable': false, 'width': 150 },
                { 'name': "Size", 'editable': false, 'width': 80 },
                { 'name': "LinkType", 'editable': false, 'width': 80 },
                { 'name': "Link", 'editable': false, 'width': 250 },
                { 'name': "Link Title", 'editable': false, 'width': 400 },
            ];
        frappeconfig['data'] = [];
        for (let f of data.files)
            frappeconfig['data'].push([
                f.filename,
                f.isused ? 'true' : 'false',
                f.cdate,
                f.mdate,
                f.filesize,
                (_a = f.linktype) !== null && _a !== void 0 ? _a : '',
                f.link_dirindex != null ? `${f.link_dirindex} / ${f.link_uid}` : '',
                (_b = f.link_title) !== null && _b !== void 0 ? _b : ''
            ]);
        frappeconfig['layout'] = 'fixed';
        frappeconfig['cellHeight'] = 24;
        frappeconfig['serialNoColumn'] = false;
        new DataTable('#root', frappeconfig);
        $('#h1more1').innerText = ``;
        $('#h1more2').innerText = `Total = ${data.meta.count_total} (${data.meta.count_preview} + ${data.meta.count_thumbnail} + ${data.meta.count_video})`;
        $('#h1more3').innerText = `Not linked = ${data.meta.count_null}/${data.meta.count_total}`;
    }
}
