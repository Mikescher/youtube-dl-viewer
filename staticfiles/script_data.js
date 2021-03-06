"use strict";
window.onload = async function () {
    await DataDumpController.refresh();
};
class DataDumpController {
    static async refresh() {
        const dom_root = $('#root');
        const response = await $ajax('GET', '/state/data');
        if (!response.success || !(response.status >= 200 && response.status < 400)) {
            console.error('Could not refresh');
            dom_root.innerHTML = '(ERROR)';
            return;
        }
        const data = JSON.parse(response.body);
        data['columns'] = data['columns'].map((v) => { return { 'name': v, 'editable': false }; });
        new DataTable('#root', data);
        $('h1').innerText = 'All video data (' + data['data'].length + ')';
    }
}
