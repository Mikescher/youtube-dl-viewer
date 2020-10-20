
class App
{
    static VIDEOLIST: VideoListModel;
    static USERINTERFACE: UserInterfaceModel;

    static showToast(text: string) { this.USERINTERFACE?.showToast(text); }
}

window.onload = async function() 
{
    App.VIDEOLIST     = new VideoListModel($('#options'));
    App.USERINTERFACE = new UserInterfaceModel();

    App.VIDEOLIST.init();
    App.USERINTERFACE.init();
};