
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
        let ctr = 1;
        for (const thumb of $all('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.UnloadAll] was canceled"); return; }

            if (thumb.getAttribute('data-loaded') === '0') continue;

            thumb.setAttribute('data-loaded', '0');
            thumb.setAttribute('src', '/thumb_empty.svg');
            
            if (ctr++ % 8 === 0) await sleepAsync(0);
        }

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    async startLoadingIntelligent(taskid: number) 
    {
        let tasks: Promise<any>[] = [];
        
        // in-viewport => parallel
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadIntelligent] was canceled"); return; }

            if (thumb.getAttribute('data-loaded') === '1') continue;

            if (!isElementInViewport(thumb)) continue; // not visible

            const src = thumb.getAttribute('data-realurl')!;

            if (thumb.getAttribute('src') === src) continue;
            
            tasks.push(setImageSource(thumb, src).then(ok =>
            {
                if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
                thumb.setAttribute('data-loaded', '1');
            }));
        }

        await Promise.all(tasks);

        // all => sequential
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadIntelligent] was canceled"); return; }

            if (thumb.getAttribute('data-loaded') === '1') continue;

            const src = thumb.getAttribute('data-realurl')!;

            if (thumb.getAttribute('src') === src) continue;

            const ok = await setImageSource(thumb, src);
            if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
            thumb.setAttribute('data-loaded', '1');
            await sleepAsync(1);
        }

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    async startLoadingSequential(taskid: number) 
    {
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadSequential] was canceled"); return; }

            if (thumb.getAttribute('data-loaded') === '1') continue;

            if (!isElementInViewport(thumb)) continue; // not visible

            const src = thumb.getAttribute('data-realurl')!;

            if (thumb.getAttribute('src') === src) continue;

            const ok = await setImageSource(thumb, src);
            if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
            thumb.setAttribute('data-loaded', '1');
            await sleepAsync(1);
        }

        if (taskid === this.currentThumbnailTask) this.currentThumbnailTask = null;
    }

    async startLoadingParallel(taskid: number) 
    {
        let tasks: Promise<any>[] = [];
        
        for (const thumb of $_all<HTMLImageElement>('.thumb_img_loadable'))
        {
            if (taskid !== this.currentThumbnailTask) { console.warn("Task [Thumbnails.LoadParallel] was canceled"); return; }

            if (thumb.getAttribute('data-loaded') === '1') continue;

            if (!isElementInViewport(thumb)) continue; // not visible

            const src = thumb.getAttribute('data-realurl')!;

            if (thumb.getAttribute('src') === src) continue;

            tasks.push(setImageSource(thumb, src).then(ok =>
            {
                if (!ok) thumb.setAttribute('src', '/thumb_empty.svg');
                thumb.setAttribute('data-loaded', '1');
            }));
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

