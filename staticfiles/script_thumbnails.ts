
class ThumbnailModel
{
    thumbnailTaskIDCounter: number = 1000;

    currentThumbnailTask: number|null = null;

    currentAnimatedVideo: string|null = null;
    
    constructor()
    {
        //
    }

    init()
    {
        window.addEventListener('scroll', () => 
        {
            if (App.VIDEOLIST.getCurrentThumbnailMode().restartOnScroll) this.restart(); 
        });
    }

    isLoadingThumbnails()
    {
        return this.currentThumbnailTask !== null;
    }
    
    start()
    {
        const mode = App.VIDEOLIST.getCurrentThumbnailMode();
        
        const taskid = this.currentThumbnailTask = this.thumbnailTaskIDCounter++;
        mode.start(this, taskid).then(()=>{});
    }
    
    stop()
    {
        this.currentThumbnailTask = null;
    }

    restart()
    {
        this.stop();
        this.start();
    }
    
    async unloadAll(taskid: number)
    {
        let tasks: Promise<any>[] = [];

        let renderer = App.VIDEOLIST.getCurrentDisplayMode().renderer;
        
        let ctr = 1;
        for (const thumb of $all('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.UnloadAll] was canceled"); return; }

            tasks.push(renderer.unsetThumbnail(thumb));
            
            if (ctr++ % 8 === 0) await sleepAsync(0);
        }

        await Promise.all(tasks);

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    async startLoadingIntelligent(taskid: number) 
    {
        let tasks: Promise<any>[] = [];
        
        let renderer = App.VIDEOLIST.getCurrentDisplayMode().renderer;
        
        // in-viewport => parallel
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadIntelligent] was canceled"); return; }

            if (!isElementInViewport(thumb)) continue; // not visible

            tasks.push(renderer.setThumbnail(thumb));
        }

        await Promise.all(tasks);

        // all => sequential
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadIntelligent] was canceled"); return; }

            tasks.push(renderer.setThumbnail(thumb));
            
            await sleepAsync(1);
        }

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    async startLoadingSequential(taskid: number) 
    {
        let tasks: Promise<any>[] = [];

        let renderer = App.VIDEOLIST.getCurrentDisplayMode().renderer;
        
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadSequential] was canceled"); return; }

            if (!isElementInViewport(thumb)) continue; // not visible

            tasks.push(renderer.setThumbnail(thumb));
            
            await sleepAsync(1);
        }

        await Promise.all(tasks);

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    async startLoadingParallel(taskid: number) 
    {
        let tasks: Promise<any>[] = [];

        let renderer = App.VIDEOLIST.getCurrentDisplayMode().renderer;
        
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadParallel] was canceled"); return; }

            if (!isElementInViewport(thumb)) continue; // not visible

            tasks.push(renderer.setThumbnail(thumb));
        }
        
        await Promise.all(tasks);

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    startAnimateThumbnail(thumb: HTMLElement)
    {
        if (App.VIDEOLIST.getCurrentThumbnailMode().index === 0) return;

        if (!App.VIDEOLIST.hasFFMPEG) return;
        if (!App.VIDEOLIST.hasCache) return;

        if (!thumb.classList.contains('animatable')) return;

        let img = thumb.querySelector<HTMLImageElement>('img')!;
        if (img.getAttribute('data-loaded') !== '1') return;

        let video = App.VIDEOLIST.getVideoByID(img.getAttribute('data-videoid')!);
        if (video === null) return;
        
        this.currentAnimatedVideo = video.meta.uid;
        
        this.animateThumbnail(App.VIDEOLIST.getCurrentDataDir(), video, img).then(()=>{})
    }
    
    async animateThumbnail(dir: DataDirDef, video: DataJSONVideo, img: HTMLImageElement)
    {
        const responseZero = await $ajax('GET', '/data/'+dir.index+'/video/'+video.meta.uid+'/prev/'+0);

        if (this.currentAnimatedVideo !== video.meta.uid) return;
        
        if (!responseZero.success || responseZero.status! < 200 || responseZero.status! > 400)
        {
            console.error('Could not load preview images (status)');
            this.currentAnimatedVideo = null;
            return;
        }
        else
        {
            console.error('Could not load preview images (status)');
        }

        const max = parseInt(responseZero.headers!.get('previewimagecount')!);

        for (let i=1;;i++)
        {
            if (this.currentAnimatedVideo !== video.meta.uid) return;

            const t = performance.now();
            await setImageSource(img, '/data/'+dir.index+'/video/'+video.meta.uid+'/prev/'+(i%max));
            await sleepAsync(Math.max(0, 333 - (performance.now() - t)));

            if (((i+1)%max) === 0) await sleepAsync(666);
        }
    }

    stopAnimateThumbnail(thumb: HTMLElement)
    {
        let img = thumb.querySelector<HTMLImageElement>('img')!;
        if (img.getAttribute('data-loaded') !== '1') return;

        let video = App.VIDEOLIST.getVideoByID(img.getAttribute('data-videoid')!);
        if (video === null) return;

        if (video.meta.uid !== this.currentAnimatedVideo) return;
        
        this.currentAnimatedVideo = null;

        img.src = img.getAttribute('data-realurl')!;
    }
    
}

