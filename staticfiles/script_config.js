"use strict";
window.onload = async function () {
    await ConfigController.refresh();
};
class ConfigController {
    static async refresh() {
        const dom_root = $('#root');
        const response = await $ajax('GET', '/state/config');
        if (!response.success || !(response.status >= 200 && response.status < 400)) {
            console.error('Could not refresh');
            dom_root.innerHTML = '(ERROR)';
            return;
        }
        const data = JSON.parse(response.body);
        let html = '';
        html += this.genCommandline(data.commandline);
        html += this.genRaw(data.raw);
        html += this.genConfigFileContent(data.configfilecontent);
        html += this.genConfig(data.config);
        html += this.genDataDirs(data.datadirs);
        html += this.genThemes(data.userthemes);
        dom_root.innerHTML = html;
    }
    static genCommandline(value) {
        let html = '';
        html += '<div class="config_root commandline">';
        {
            html += '<h2>Commandline</h2>';
            html += '<code>' + escapeHtml(value) + '</code>';
        }
        html += '</div class>';
        return html;
    }
    static genRaw(value) {
        let html = '';
        html += '<div class="config_root arguments">';
        {
            html += '<h2>Arguments</h2>';
            html += '<table>';
            {
                html += '<tr><th>Key</th><th>Value</th></tr>';
                for (const v of value) {
                    html += '<tr>';
                    html += '<td>' + escapeHtml(v.key) + '</td>';
                    html += '<td>' + escapeHtml(v.value) + '</td>';
                    html += '</tr>';
                }
            }
            html += '</table>';
        }
        html += '</div class>';
        return html;
    }
    static genConfigFileContent(value) {
        let html = '';
        html += '<div class="config_root configfile">';
        {
            html += '<h2>Configfile</h2>';
            html += '<code class="scroll">' + escapeHtml(value) + '</code>';
        }
        html += '</div class>';
        return html;
    }
    static genConfig(value) {
        let html = '';
        html += '<div class="config_root configs">';
        {
            html += '<h2>Config</h2>';
            html += '<table>';
            {
                html += '<tr><th>Key</th><th>Value</th><th>Original</th></tr>';
                for (const v of value) {
                    html += '<tr class="' + (v.changed ? 'changed_true' : 'changed_false') + ' ' + (v.provided ? 'provided_true' : 'provided_false') + '">';
                    html += '<td>' + escapeHtml(v.key) + '</td>';
                    html += '<td>' + escapeHtml(v.value_current_fmt) + '</td>';
                    html += '<td>' + escapeHtml(v.value_original_fmt) + '</td>';
                    html += '</tr>';
                }
            }
            html += '</table>';
        }
        html += '</div class>';
        return html;
    }
    static genDataDirs(value) {
        let html = '';
        html += '<div class="config_root datadirs">';
        {
            html += '<h2>Directories</h2>';
            for (const v of value) {
                html += '<div class="config_sub datadir">';
                {
                    html += '<table>';
                    {
                        html += '<tr><th>Key</th><th>Value</th></tr>';
                        html += '<tr><td>index</td><td>' + escapeHtml(v.index.toString()) + '</td></tr>';
                        html += '<tr><td>selector_id</td><td>' + escapeHtml(v.selector_id) + '</td></tr>';
                        html += '<tr><td>full_order_filename</td><td>' + escapeHtml(v.full_order_filename) + '</td></tr>';
                    }
                    html += '</table>';
                    html += '<code>' + escapeHtml(v.spec) + '</code>';
                    html += '<table>';
                    {
                        html += '<tr><th>Key</th><th>Value</th></tr>';
                        for (const iv of v.values) {
                            html += '<tr class="' + (iv.changed ? 'changed_true' : 'changed_false') + '">';
                            html += '<td>' + escapeHtml(iv.key) + '</td>';
                            html += '<td>' + escapeHtml(iv.value) + '</td>';
                            html += '</tr>';
                        }
                    }
                    html += '</table>';
                }
                html += '</div class>';
            }
        }
        html += '</div class>';
        return html;
    }
    static genThemes(value) {
        let html = '';
        html += '<div class="config_root themes">';
        {
            html += '<h2>Themes</h2>';
            for (const v of value) {
                html += '<div class="config_sub theme">';
                {
                    html += '<table>';
                    {
                        html += '<tr><th>Key</th><th>Value</th></tr>';
                        html += '<tr><td>index</td><td>' + escapeHtml(v.name.toString()) + '</td></tr>';
                        html += '<tr><td>index</td><td>' + escapeHtml(v.index.toString()) + '</td></tr>';
                        html += '<tr><td>selector_id</td><td>' + escapeHtml(v.selector_id) + '</td></tr>';
                        html += '<tr><td>filename</td><td>' + escapeHtml(v.filename) + '</td></tr>';
                        html += '<tr><td>fullpath</td><td>' + escapeHtml(v.fullpath) + '</td></tr>';
                        html += '<tr><td>selector_id</td><td>' + escapeHtml(v.selector_id) + '</td></tr>';
                    }
                    html += '</table>';
                    html += '<code class="scroll">' + escapeHtml(v.css) + '</code>';
                }
                html += '</div class>';
            }
        }
        html += '</div class>';
        return html;
    }
}
