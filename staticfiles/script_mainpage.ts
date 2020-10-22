
class App
{
    static VIDEOLIST: VideoListModel;
    static UI:        UserInterfaceModel;
    static PLAYER:    VideoPlayerModel;
    static THUMBS:    ThumbnailModel;

    static showToast(text: string) { this.UI?.showToast(text); }
}

window.onload = async function() 
{
    App.VIDEOLIST = new VideoListModel($('#options')!);
    App.UI        = new UserInterfaceModel();
    App.PLAYER    = new VideoPlayerModel();
    App.THUMBS    = new ThumbnailModel();

    App.VIDEOLIST.init();
    App.UI.init();
    App.PLAYER.init();
    App.THUMBS.init();
};