
window.onload = async function()
{
    await StatusController.start();
};

class StatusController
{
    public static async start()
    {
        for(;;)
        {
            try { await StatusController.refresh(); } catch (e) { console.error('Exception in refresh(): ' + e); }
            await sleepAsync(1024);
        }
    }
    
    public static async refresh()
    {
        const dom_html = $('html')!;
        
        try 
        {
            const response = await $ajax('GET', '/state/system');

            if (!response.success || !(response.status! >= 200 && response.status! < 400)) { console.error('Could not refresh (statuscode)'); dom_html.classList.add("error"); return; }
            dom_html.classList.remove("error");

            const data = JSON.parse(response.body!)

            for (const dst of $_all<HTMLElement>("*[data-jsonlink]"))
            {
                let obj = data;
                for (const split of dst.getAttribute("data-jsonlink")!.split('.')) obj = obj[split];
                dst.textContent = obj;
                dst.classList.add("okay");
            }
        } 
        catch (e) 
        {
            console.error('Could not refresh (exception)');
            console.error(e);
            dom_html.classList.add("error");
            return;
        }
    }
}
