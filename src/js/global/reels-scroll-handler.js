navigation.addEventListener('navigate', (e) => {
    // Scroll on /reels/:code page like tiktok
    const url = new URL(e.destination.url);
    const match = url.pathname.match(/\/(reels)\/([A-Za-z0-9_-]*)(\/?)/);
    if (match) {
        const reels = document.querySelectorAll('main>div>div');
        reels.forEach((element) => {
            const queryReference = getValueByKey(element, 'PolarisClipsViewer_media_identifier');
            if (queryReference?.pk && queryReference?.code && queryReference?.code === match[2]) {
                window.dispatchEvent(
                    new CustomEvent('postView', {
                        detail: {
                            id: queryReference.pk,
                            code: queryReference.code,
                        },
                    }),
                );
                return;
            }
        });
    }
});
