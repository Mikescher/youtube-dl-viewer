"use strict";
class App {
    static showToast(text) { var _a; (_a = this.UI) === null || _a === void 0 ? void 0 : _a.showToast(text); }
}
window.onload = async function () {
    App.VIDEOLIST = new VideoListModel($('#options'));
    App.UI = new UserInterfaceModel();
    App.PLAYER = new VideoPlayerModel();
    App.THUMBS = new ThumbnailModel();
    App.VIDEOLIST.init();
    App.UI.init();
    App.PLAYER.init();
    App.THUMBS.init();
};
