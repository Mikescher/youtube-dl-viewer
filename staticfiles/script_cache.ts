
window.onload = async function()
{
    await CacheStatusController.refresh();
};

declare var DataTable: any; // frappe-datatable

namespace DataDump
{
    export interface JSONDataFile
    {
        path: string,
        filename: string,
        directory: string,
        extension: string,
        readonly: boolean,

        cdate: string,
        cdate_f: number,
        mdate: string,
        mdate_f: number,
        adate: string,
        adate_f: number,

        filesize: string,
        filesize_r: number,

        isused: boolean,
        linktype: string|null,
        link_uid: string|null,
        link_title: string|null,
        link_pathvideo: string|null,
        link_dirindex: string|null,
        link_dirtile: string|null,
    }

    export interface JSONDataMeta
    {
        count_total: number,
        count_preview: number,
        count_thumbnail: number,
        count_video: number,
        count_null: number,
    }

    export interface JSONData
    {
        meta: JSONDataMeta,
        files: JSONDataFile[],
    }
}

class CacheStatusController
{
    public static async refresh()
    {
        const dom_root = $('#root')!

        const response = await $ajax('GET', '/state/cache');

        if (!response.success || !(response.status! >= 200 && response.status! < 400)) { console.error('Could not refresh'); dom_root.innerHTML = '(ERROR)'; return; }

        const data = JSON.parse(response.body!) as DataDump.JSONData;

        let frappeconfig = {} as any;

        frappeconfig['columns'] =
            [
                { 'name': "Filename",   'editable': false, 'width': 550 },
                { 'name': "Used",       'editable': false, 'width':  50 },
                { 'name': "CDate",      'editable': false, 'width': 150 },
                { 'name': "MDate",      'editable': false, 'width': 150 },
                { 'name': "Size",       'editable': false, 'width':  80 },
                { 'name': "LinkType",   'editable': false, 'width':  80 },
                { 'name': "Link",       'editable': false, 'width': 250 },
                { 'name': "Link Title", 'editable': false, 'width': 400 },
            ];

        frappeconfig['data'] = [];
        for (let f of data.files) frappeconfig['data'].push(
            [
                f.filename,
                f.isused ? 'true' : 'false',
                f.cdate,
                f.mdate,
                f.filesize,
                f.linktype ?? '',
                f.link_dirindex != null ? `${f.link_dirindex} / ${f.link_uid}` : '',
                f.link_title ?? ''
            ]
        );

        frappeconfig['layout']         = 'fixed';
        frappeconfig['cellHeight']     = 24;
        frappeconfig['serialNoColumn'] = false;

        new DataTable('#root', frappeconfig);

        $('#h1more1')!.innerText = ``;
        $('#h1more2')!.innerText = `Total = ${data.meta.count_total} (${data.meta.count_preview} + ${data.meta.count_thumbnail} + ${data.meta.count_video})`
        $('#h1more3')!.innerText = `Not linked = ${data.meta.count_null}/${data.meta.count_total}`
    }
}
