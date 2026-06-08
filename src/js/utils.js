function saveFile(blob, fileName) {
    const a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.addEventListener('click', (e) => e.stopPropagation());
    a.click();
    URL.revokeObjectURL(a.href);
}

function getCookieValue(name) {
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1];
}

function getFetchOptions() {
    return {
        headers: {
            // Hardcode variable: a="129477";f.ASBD_ID=a in JS, can be remove
            // 'x-asbd-id': '129477',
            'x-csrftoken': getCookieValue('csrftoken'),
            'x-ig-app-id': '936619743392459',
            'x-ig-www-claim': sessionStorage.getItem('www-claim-v2'),
            // 'x-instagram-ajax': '1006598911',
            'x-requested-with': 'XMLHttpRequest',
        },
        referrer: window.location.href,
        referrerPolicy: 'strict-origin-when-cross-origin',
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
    };
}

function getValueByKey(obj, key) {
    if (typeof obj !== 'object' || obj === null) return null;
    const stack = [obj];
    const visited = new Set();
    let count = 0;
    while (stack.length && count < 2000) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        count++;

        try {
            if (Object.prototype.hasOwnProperty.call(current, key)) return current[key];
            if (current[key] !== undefined) return current[key];
        } catch (error) {}

        const isNode = current instanceof Node;
        const keys = Object.keys(current);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (isNode && !k.startsWith('__react')) continue;
            try {
                const value = current[k];
                if (value && typeof value === 'object' && !(value instanceof Node)) {
                    stack.push(value);
                }
            } catch (error) {}
        }
    }
    return null;
}

function resetDownloadState() {
    const DOWNLOAD_BUTTON = document.querySelector('.download-button');
    DOWNLOAD_BUTTON.classList.remove('loading');
    DOWNLOAD_BUTTON.textContent = 'Download';
    DOWNLOAD_BUTTON.disabled = false;
}

async function saveMedia(media, fileName) {
    try {
        const respone = await fetch(media.src);
        const blob = await respone.blob();
        saveFile(blob, fileName);
    } catch (error) {
        console.log(error);
    }
}

async function saveZip() {
    const DOWNLOAD_BUTTON = document.querySelector('.download-button');
    DOWNLOAD_BUTTON.classList.add('loading');
    DOWNLOAD_BUTTON.textContent = 'Loading...';
    DOWNLOAD_BUTTON.disabled = true;
    const media = Array.from(document.querySelectorAll('.overlay.checked')).map((item) => item.previousElementSibling);
    const zipFileName = media[0].title.replaceAll(' | ', '_') + '.zip';
    async function fetchSelectedMedia() {
        let count = 0;
        const results = await Promise.allSettled(
            media.map(async (media) => {
                const res = await fetch(media.src);
                const blob = await res.blob();
                const data = {
                    title: media.title.replaceAll(' | ', '_'),
                    data: blob,
                };
                data.title = media.nodeName === 'VIDEO' ? `${data.title}.mp4` : `${data.title}.jpeg`;
                count++;
                DOWNLOAD_BUTTON.textContent = `${count}/${media.length}`;
                return data;
            }),
        );
        results.forEach((promise) => {
            if (promise.status === 'rejected') throw new Error('Fail to fetch');
        });
        return results.map((promise) => promise.value);
    }
    try {
        const media = await fetchSelectedMedia();
        const blob = await createZip(media);
        saveFile(blob, zipFileName);
        document.querySelectorAll('.overlay').forEach((element) => {
            element.classList.remove('checked');
        });
        resetDownloadState();
    } catch (error) {
        console.log(error);
        resetDownloadState();
    }
}

function shouldDownload() {
    if (window.location.pathname === '/' && appState.getFieldChange() !== 'none') {
        return appState.getFieldChange();
    }
    appState.setCurrentShortcode();
    appState.setCurrentUsername();
    appState.setCurrentHightlightsId();
    function getCurrentPage() {
        const currentPath = window.location.pathname;
        if (currentPath.match(IG_POST_REGEX)) return 'post';
        if (currentPath.match(IG_STORY_REGEX)) {
            if (currentPath.match(IG_HIGHLIGHT_REGEX)) return 'highlights';
            return 'stories';
        }
        if (currentPath === '/') return 'post';
        return 'none';
    }
    const currentPage = getCurrentPage();
    const valueChange = appState.getFieldChange();
    if (['highlights', 'stories', 'post'].includes(currentPage)) {
        if (currentPage === valueChange) return valueChange;
        if (appState.currentDisplay !== currentPage) return currentPage;
    }
    return 'none';
}

function setDownloadState(state = 'ready') {
    const DOWNLOAD_BUTTON = document.querySelector('.download-button');
    const MEDIA_CONTAINER = document.querySelector('.media-container');
    const options = {
        ready() {
            DOWNLOAD_BUTTON.classList.add('loading');
            DOWNLOAD_BUTTON.textContent = 'Loading...';
            DOWNLOAD_BUTTON.disabled = true;
            MEDIA_CONTAINER.replaceChildren();
        },
        fail() {
            resetDownloadState();
        },
        success() {
            DOWNLOAD_BUTTON.disabled = false;
            appState.setPreviousValues();
            const photosArray = MEDIA_CONTAINER.querySelectorAll('img , video');
            let loadedPhotos = 0;
            function countLoaded() {
                loadedPhotos++;
                if (loadedPhotos === photosArray.length) resetDownloadState();
            }
            photosArray.forEach((media) => {
                if (media.tagName === 'IMG') {
                    media.addEventListener('load', countLoaded);
                    media.addEventListener('error', countLoaded);
                } else {
                    media.addEventListener('loadeddata', countLoaded);
                    media.addEventListener('abort', countLoaded);
                }
            });
        },
    };
    options[state]();
}

async function handleDownload() {
    let data = null;
    const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
    const DISPLAY_CONTAINER = document.querySelector('.display-container');
    const option = shouldDownload();
    const totalItemChecked = Array.from(document.querySelectorAll('.overlay.checked'));
    if (
        TITLE_CONTAINER.classList.contains('multi-select') &&
        !DISPLAY_CONTAINER.classList.contains('hide') &&
        option === 'none' &&
        totalItemChecked.length !== 0
    ) {
        return saveZip();
    }
    const DOWNLOAD_BUTTON = document.querySelector('.download-button');
    const rect = DOWNLOAD_BUTTON.getBoundingClientRect();
    const estimatedHeight = Math.min(window.innerHeight * 0.75, 800);
    const containerWidth = Math.min(window.innerHeight * 0.8 / 5 * 3, 480);
    let bottom = window.innerHeight - rect.top + 10;
    let right = window.innerWidth - rect.right;

    if (rect.top - estimatedHeight - 20 < 0) {
        bottom = window.innerHeight - rect.bottom - estimatedHeight - 10;
        DISPLAY_CONTAINER.style.transformOrigin = '85% top';
    } else {
        DISPLAY_CONTAINER.style.transformOrigin = '85% bottom';
    }

    // Constraints — keep panel within viewport
    if (bottom < 10) bottom = 10;
    if (bottom + estimatedHeight > window.innerHeight) bottom = window.innerHeight - estimatedHeight - 10;
    if (right < 10) right = 10;
    if (right + containerWidth > window.innerWidth) right = window.innerWidth - containerWidth - 10;

    DISPLAY_CONTAINER.style.bottom = `${bottom}px`;
    DISPLAY_CONTAINER.style.right = `${right}px`;

    requestAnimationFrame(() => { DISPLAY_CONTAINER.classList.remove('hide'); });
    if (option === 'none') return;
    setDownloadState('ready');
    option === 'post' ? (data = await downloadPostPhotos()) : (data = await downloadStoryPhotos(option));
    if (!data) return setDownloadState('fail');
    appState.currentDisplay = option;
    renderMedia(data);
}

function renderMedia(data) {
    const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
    const MEDIA_CONTAINER = document.querySelector('.media-container');
    MEDIA_CONTAINER.replaceChildren();
    if (!data) return;
    const fragment = document.createDocumentFragment();
    const date = new Date(data.date * 1000).toISOString().split('T')[0];
    data.media.forEach((item) => {
        const attributes = {
            class: 'media-item',
            src: item.url,
            title: `${data.user.username} | ${item.id} | ${date}`,
            controls: '',
        };
        const ITEM_TEMPLATE = `<div>
				${item.isVideo ? `<video></video>` : '<img/>'}
				<div class="overlay">✔</div>
			</div>`;
        const itemDOM = new DOMParser().parseFromString(ITEM_TEMPLATE, 'text/html').body.firstElementChild;
        const media = itemDOM.querySelector('img, video');
        const selectBox = itemDOM.querySelector('.overlay');
        Object.keys(attributes).forEach((key) => {
            if (item.isVideo) media.setAttribute(key, attributes[key]);
            else if (key !== 'controls') media.setAttribute(key, attributes[key]);
        });
        media.addEventListener('click', (e) => {
            e.stopPropagation();
            if (TITLE_CONTAINER.classList.contains('multi-select')) {
                if (item.isVideo) e.preventDefault();
                selectBox.classList.toggle('checked');
            } else saveMedia(media, media.title.replaceAll(' | ', '_') + `${item.isVideo ? '.mp4' : '.jpeg'}`);
        });
        fragment.appendChild(itemDOM);
    });
    MEDIA_CONTAINER.appendChild(fragment);
    TITLE_CONTAINER.classList.remove('multi-select');
    setDownloadState('success');
}

function handleLongClick(element, shortClickHandler, longClickHandler, delay = 400) {
    element.addEventListener('mousedown', (e) => {
        if (e.button === 2) return;
        let count = 0;
        const intervalId = setInterval(() => {
            count = count + 10;
            if (count >= delay) {
                clearInterval(intervalId);
                longClickHandler();
            }
        }, 10);
        element.addEventListener(
            'mouseup',
            () => {
                clearInterval(intervalId);
                if (count < delay) shortClickHandler();
            },
            { once: true },
        );
    });
}

function isValidJson(string) {
    try {
        JSON.parse(string);
        return true;
    } catch {
        return false;
    }
}

async function downloadAll() {
    const DOWNLOAD_ALL_BTN = document.querySelector('.download-all-button');
    const DOWNLOAD_BUTTON = document.querySelector('.download-button');
    const MEDIA_CONTAINER = document.querySelector('.media-container');
    const mediaItems = Array.from(MEDIA_CONTAINER.querySelectorAll('img.media-item, video.media-item'));

    if (mediaItems.length === 0) return;

    DOWNLOAD_ALL_BTN.disabled = true;

    // Single item — just download it directly
    if (mediaItems.length === 1) {
        const media = mediaItems[0];
        const ext = media.tagName === 'VIDEO' ? '.mp4' : '.jpeg';
        await saveMedia(media, media.title.replaceAll(' | ', '_') + ext);
        DOWNLOAD_ALL_BTN.disabled = false;
        return;
    }

    // Multiple items — bundle into ZIP
    DOWNLOAD_BUTTON.classList.add('loading');
    DOWNLOAD_BUTTON.textContent = 'Loading...';
    DOWNLOAD_BUTTON.disabled = true;

    const zipFileName = mediaItems[0].title.replaceAll(' | ', '_') + '_all.zip';
    let count = 0;

    try {
        const results = await Promise.allSettled(mediaItems.map(async (media) => {
            const res = await fetch(media.src);
            const blob = await res.blob();
            const ext = media.tagName === 'VIDEO' ? '.mp4' : '.jpeg';
            const title = media.title.replaceAll(' | ', '_') + ext;
            count++;
            DOWNLOAD_BUTTON.textContent = `${count}/${mediaItems.length}`;
            return { title, data: blob };
        }));

        if (results.some(r => r.status === 'rejected')) throw new Error('Some downloads failed');

        const files = results.map(r => r.value);
        const blob = await createZip(files);
        saveFile(blob, zipFileName);
    } catch (error) {
        console.log(error);
    } finally {
        DOWNLOAD_ALL_BTN.disabled = false;
        resetDownloadState();
    }
}
