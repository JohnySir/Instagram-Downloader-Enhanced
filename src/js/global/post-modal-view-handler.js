/**
 * I have the algorithm that Instagram use to convert between post id and post shortcode.
 * But if the post is from a private profile, they add some extra stuff to the shortcode.
 * And I don't know how to convert between them.
 * So I wrote this to cache post id when user view post to reduce one api call.
 *
 */
(() => {
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(...args);
            }, delay);
        };
    }

    const handleMutation = debounce(() => {
        let article = document.querySelector('article[role="presentation"]');
        if (article) {
            const postInfo = getValueByKey(article, 'post');
            if (postInfo) {
                if (postInfo.id && postInfo.code) {
                    window.dispatchEvent(
                        new CustomEvent('postView', {
                            detail: {
                                id: postInfo.id,
                                code: postInfo.code,
                            },
                        }),
                    );
                }
                stopObserve();
            }
        }
    }, 100);

    const observer = new MutationObserver(handleMutation);

    function startObserve() {
        stopObserve();
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function stopObserve() {
        observer.disconnect();
    }

    navigation.addEventListener('navigate', (e) => {
        const url = new URL(e.destination.url);
        if (url.pathname.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/)) {
            startObserve();
        } else {
            stopObserve();
        }
    });

    // Check on initial load
    if (window.location.pathname.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/)) {
        startObserve();
    }
})();
