class App {
    static showToast(text) { var _a; (_a = this.USERINTERFACE) === null || _a === void 0 ? void 0 : _a.showToast(text); }
}
window.onload = async function () {
    App.VIDEOLIST = new VideoListModel($('#options'));
    App.USERINTERFACE = new UserInterfaceModel();
    App.VIDEOLIST.init();
    App.USERINTERFACE.init();
};
