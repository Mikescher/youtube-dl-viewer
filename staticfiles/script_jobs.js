"use strict";
/*
    [ youtube-dl-viewer <jobview> ]
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var DATA = {
    last_json: '',
    last_text_head: '',
    last_text_content: '',
    last_job_concat: '',
    last_job_texts: {},
};
function $(sel) {
    return document.querySelector(sel);
}
function $all(sel) {
    return document.querySelectorAll(sel);
}
function $attr(sel, attr) {
    return document.querySelector(sel).getAttribute(attr);
}
function $ajax(method, url) {
    return new Promise(function (resolve) {
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onload = function () {
            var headerMap = {};
            request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(function (line) { var parts = line.split(': '); var header = parts.shift(); headerMap[header.toLowerCase()] = parts.join(': '); });
            resolve({ success: true, status: this.status, statusText: this.statusText, body: this.response, headers: headerMap });
        };
        request.onerror = function () {
            resolve({ success: false, status: null, statusText: null, body: null, headers: null });
        };
        request.send();
    });
}
function escapeHtml(text) {
    if (typeof text !== "string")
        text = ("" + text).toString();
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
function sleepAsync(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
window.onload = function () {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, refresh()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    e_1 = _a.sent();
                    console.error('Exception in refresh(): ' + e_1);
                    return [4 /*yield*/, unfresh()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, sleepAsync(100)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 0];
                case 7: return [2 /*return*/];
            }
        });
    });
};
function refresh() {
    return __awaiter(this, void 0, void 0, function () {
        var linelen, progressLen, response, data, text_head, job_concat, _i, _a, job, html_jobs_shell, _b, _c, job, _loop_1, _d, _e, job;
        var _this = this;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    linelen = Math.max(110, Math.floor($('#root').clientWidth / $('#font_test').clientWidth));
                    progressLen = linelen - (14 + 50 + 10 + 10 + 8 + 7);
                    return [4 /*yield*/, $ajax('GET', '/jobmanager/list')];
                case 1:
                    response = _f.sent();
                    if (!(!response.success || !(response.status >= 200 && response.status < 400))) return [3 /*break*/, 3];
                    console.error('Could not refresh');
                    return [4 /*yield*/, unfresh()];
                case 2:
                    _f.sent();
                    return [2 /*return*/];
                case 3:
                    $('html').classList.remove('unfresh');
                    if (DATA.last_json === '') {
                        $('#root').innerHTML =
                            '<div id="root_head" class="meta"></div>' +
                                '<div id="root_content" class="meta"></div>';
                    }
                    if ((linelen + ";" + response.body) === DATA.last_json)
                        return [2 /*return*/];
                    DATA.last_json = (linelen + ";" + response.body);
                    data = JSON.parse(response.body);
                    text_head = "";
                    text_head += ("Active Jobs: " + data.Meta.Jobs.CountActive).padEnd(linelen - 34, ' ') + " <span id=\"btnForceGenPreviews\" class=\"btn btn-action\">[Force generate missing previews]</span>" + "\n";
                    text_head += ("Queued Jobs: " + data.Meta.Jobs.CountQueued).padEnd(linelen - 33, ' ') + " <span id=\"btnForceTranscode\" class=\"btn btn-action\">[Force transcode missing videos]</span>" + "\n";
                    text_head += (("Cached Previews:                " + ("" + data.Meta.Videos.CountCachedPreviews).padStart(3, " ") + " / " + data.Meta.Videos.CountTotal).padEnd(44, ' ') + "( " + formatBytes(data.Meta.Videos.FilesizeCachedPreviews).padStart(8, ' ') + " )").padEnd(linelen - 22, ' ') + " <span id=\"btnClearFinished\" class=\"btn btn-action\">[Clear finished jobs]</span>" + "\n";
                    text_head += (("Cached Videos (webm transcode): " + ("" + data.Meta.Videos.CountCachedVideos).padStart(3, " ") + " / " + data.Meta.Videos.CountTotal).padEnd(44, ' ') + "( " + formatBytes(data.Meta.Videos.FilesizeCachedVideos).padStart(8, ' ') + " )").padEnd(linelen - 17, ' ') + " <span id=\"btnAbortAll\" class=\"btn btn-danger\">[Abort all jobs]</span>" + "\n";
                    text_head += "\n";
                    text_head += "<span class=\"header\">" + ("Type").padEnd(14, ' ') + ("Name").padEnd(50, ' ') + ("Proxies").padEnd(10, ' ') + ("State").padEnd(10, ' ') + ("Progress").padEnd(progressLen, ' ') + ("Time").padEnd(8, ' ') + ("Actions").padEnd(7, ' ') + "</span>" + "\n";
                    if (DATA.last_text_head !== (linelen + ";" + text_head)) {
                        DATA.last_text_head = (linelen + ";" + text_head);
                        $('#root_head').innerHTML = text_head;
                        updateEvents_Head();
                    }
                    job_concat = '';
                    for (_i = 0, _a = data.Jobs; _i < _a.length; _i++) {
                        job = _a[_i];
                        job_concat += job.ID;
                    }
                    if (DATA.last_job_concat !== job_concat) {
                        DATA.last_job_concat = job_concat;
                        DATA.last_job_texts = {};
                        html_jobs_shell = '';
                        for (_b = 0, _c = data.Jobs; _b < _c.length; _b++) {
                            job = _c[_b];
                            html_jobs_shell += '<div id="jobshell_' + job.ID + '" class="meta"></div>';
                        }
                        $('#root_content').innerHTML = html_jobs_shell;
                    }
                    _loop_1 = function (job) {
                        var error_tt = '';
                        //if (job.Error !== null) error_tt = "data-tooltip=\"" + escapeHtml(job.Error) + "\" data-attached=\"0\"";
                        if (job.Error !== null)
                            error_tt = " title=\"" + escapeHtml(job.Error) + "\" ";
                        var col1 = (job.ManagerName).padEnd(14, ' ');
                        var col2 = "<span class=\"maxlen\" style=\"max-width: 48ch\">" + escapeHtml(job.Name.padEnd(50, ' ')) + "</span>" + "  ";
                        var col3 = (("" + job.ProxyCount).padStart(2, ' ') + " / " + ("" + job.ProxyRequests).padStart(2, ' ')).padEnd(10, ' ');
                        var col4 = "<span class=\"statecol state_" + job.State + "\" " + error_tt + ">" + (job.State).padEnd(10, ' ') + "</span>";
                        var col5 = "[<span class=\"colProgress\">" + ("").padEnd(Math.floor((progressLen - 4) * job.Progress), '#').padEnd(progressLen - 4, ' ') + "</span>]" + "  ";
                        var col6 = ("" + job.Time).padEnd(8, ' ');
                        var col7 = "<span class=\"btnAbort btn " + (job.AbortRequest ? "btn-warn" : "btn-danger") + "\" data-jobid=\"" + job.ID + "\">[Abort]</span>";
                        var job_content = "<span class=\"job state_" + job.State + " queue_" + job.QueueName + " abort_" + job.AbortRequest + "\">" + [col1, col2, col3, col4, col5, col6, col7].join("") + "</span>" + "\n";
                        if (!DATA.last_job_texts.hasOwnProperty(job.ID) || DATA.last_job_texts[job.ID] !== job_content) {
                            DATA.last_job_texts[job.ID] = job_content;
                            $('#jobshell_' + job.ID).innerHTML = job_content;
                            var btn_1 = $('#jobshell_' + job.ID + ' .btnAbort');
                            btn_1.addEventListener('click', function (e) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, $ajax('GET', '/jobmanager/abort/' + btn_1.getAttribute('data-jobid'))];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                        }
                    };
                    for (_d = 0, _e = data.Jobs; _d < _e.length; _d++) {
                        job = _e[_d];
                        _loop_1(job);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function unfresh() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            $('html').classList.add('unfresh');
            return [2 /*return*/];
        });
    });
}
function updateEvents_Head() {
    var _this = this;
    $('#btnForceGenPreviews').addEventListener('click', function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ($('#root').classList.contains('unfresh'))
                        return [2 /*return*/];
                    return [4 /*yield*/, $ajax('GET', '/jobmanager/start/generatePreviews/*/*')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    $('#btnForceTranscode').addEventListener('click', function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ($('#root').classList.contains('unfresh'))
                        return [2 /*return*/];
                    return [4 /*yield*/, $ajax('GET', '/jobmanager/start/generateTranscode/*/*')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    $('#btnClearFinished').addEventListener('click', function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ($('#root').classList.contains('unfresh'))
                        return [2 /*return*/];
                    return [4 /*yield*/, $ajax('GET', '/jobmanager/clearFinished')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    $('#btnAbortAll').addEventListener('click', function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ($('#root').classList.contains('unfresh'))
                        return [2 /*return*/];
                    return [4 /*yield*/, $ajax('GET', '/jobmanager/abort/*')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
}
function formatBytes(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0)
        return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}
