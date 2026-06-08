const IG_BASE_URL = window.location.origin + '/';
/**
 * @deprecated
 */
const IG_PROFILE_HASH = '69cba40317214236af40e7efa697781d';
/**
 * @deprecated
 */
const IG_POST_HASH = '9f8827793ef34641b2fb195d4d41151c';

const IG_SHORTCODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const IG_POST_REGEX = /\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/;
const IG_STORY_REGEX = /\/(stories)\/(.*?)\/(\d*)(\/?)/;
const IG_HIGHLIGHT_REGEX = /\/(stories)\/(highlights)\/(\d*)(\/?)/;

const APP_NAME = `${chrome.runtime.getManifest().name} v${chrome.runtime.getManifest().version}`;

const appCache = Object.freeze({
    /**
     * Cache user id, reduce one api call to get id from username
     *
     * username => id
     */
    userIdsCache: new Map(),
    /**
     * Cache post id, reduce one api call to get post id from shortcode.
     *
     * Only for private profile, check out  post-modal-view-handler.js
     *
     * shortcode => post_id
     */
    postIdInfoCache: new Map(),
});

const appState = Object.freeze(
    (() => {
        let currentDisplay = '';
        const current = {
            shortcode: '',
            username: '',
            highlights: '',
        };
        const previous = {
            shortcode: '',
            username: '',
            highlights: '',
        };
        window.addEventListener('shortcodeChange', (e) => {
            current.shortcode = e.detail.code;
        });
        return {
            get currentDisplay() {
                return currentDisplay;
            },
            set currentDisplay(value) {
                if (['post', 'stories', 'highlights'].includes(value)) currentDisplay = value;
            },
            current: Object.freeze({
                get shortcode() {
                    return current.shortcode;
                },
                set shortcode(value) {
                    if (value === current.shortcode) return;
                    current.shortcode = value;
                    downloadPostPhotos().then((data) => {
                        renderMedia(data);
                        currentDisplay = 'post';
                    });
                },
                get username() {
                    return current.username;
                },
                set username(value) {
                    if (value === current.username) return;
                    current.username = value;
                    downloadStoryPhotos('stories').then((data) => {
                        renderMedia(data);
                        currentDisplay = 'stories';
                    });
                },
                get highlights() {
                    return current.highlights;
                },
                set highlights(value) {
                    if (value === current.highlights) return;
                    current.highlights = value;
                    downloadStoryPhotos('highlights').then((data) => {
                        renderMedia(data);
                        currentDisplay = 'hightlights';
                    });
                },
            }),
            setCurrentShortcode() {
                const page = window.location.pathname.match(IG_POST_REGEX);
                if (page) current.shortcode = page[2];
            },
            setCurrentUsername() {
                const page = window.location.pathname.match(IG_STORY_REGEX);
                if (page && page[2] !== 'highlights') current.username = page[2];
            },
            setCurrentHightlightsId() {
                const page = window.location.pathname.match(IG_HIGHLIGHT_REGEX);
                if (page) current.highlights = page[3];
            },
            setPreviousValues() {
                Object.keys(current).forEach((key) => {
                    previous[key] = current[key];
                });
            },
            getFieldChange() {
                if (current.highlights !== previous.highlights) return 'highlights';
                if (current.username !== previous.username) return 'stories';
                if (current.shortcode !== previous.shortcode) return 'post';
                return 'none';
            },
        };
    })(),
);

(() => {
    function createElement(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html').body;
        const fragment = document.createDocumentFragment();
        fragment.append(...doc.childNodes);
        return fragment;
    }
    function initUI() {
        document.body.appendChild(
            createElement(
                `<div class="display-container hide">
                    <div class="title-container">
                        <span title="${APP_NAME}">Media</span>
                        <div style="display: flex; align-items: center;">
                            <button class="download-all-button" title="Download All">⬇</button>
                            <button class="lock-button">🔒</button>
                            <button class="esc-button">&times</button>
                        </div>
                    </div>
                    <div class="media-container">
                        <p style="position: absolute;top: 50%;transform: translate(0%, -50%);">
                            Nothing to download
                        </p>
                    </div>
                </div>
                <button title="Shift+D" class="download-button">Download</button>`,
            ),
        );
    }
    function handleEvents() {
        const ESC_BUTTON = document.querySelector('.esc-button');
        const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
        const DISPLAY_CONTAINER = document.querySelector('.display-container');
        const DOWNLOAD_BUTTON = document.querySelector('.download-button');
        const LOCK_BUTTON = document.querySelector('.lock-button');
        const DOWNLOAD_ALL_BUTTON = document.querySelector('.download-all-button');
        const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA'];
        const ESC_EVENT_KEYS = ['Escape', 'C'];
        const DOWNLOAD_EVENT_KEYS = ['D'];
        const SELECT_EVENT_KEYS = ['S'];
        // --- Drag state ---
        let isDragging = false;
        let hasMoved = false;
        let startX, startY;
        let startLeft, startTop;
        function setTheme() {
            const isDarkMode =
                localStorage.getItem('igt') === null
                    ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    : localStorage.getItem('igt') === 'dark';
            if (isDarkMode) {
                DISPLAY_CONTAINER.classList.add('dark');
                DISPLAY_CONTAINER.firstElementChild.classList.add('dark');
            } else {
                DISPLAY_CONTAINER.classList.remove('dark');
                DISPLAY_CONTAINER.firstElementChild.classList.remove('dark');
            }
        }
        function pauseVideo() {
            if (DISPLAY_CONTAINER.classList.contains('hide')) {
                DISPLAY_CONTAINER.querySelectorAll('video').forEach((video) => {
                    video.pause();
                });
            }
        }
        function toggleSelectMode() {
            if (TITLE_CONTAINER.classList.contains('multi-select')) {
                TITLE_CONTAINER.title = 'Hold to select / deselect all';
                DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach((element) => {
                    element.classList.add('show');
                });
            } else {
                TITLE_CONTAINER.textContent = 'Media';
                TITLE_CONTAINER.title = APP_NAME;
                DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach((element) => {
                    element.classList.remove('show');
                });
            }
        }
        function handleSelectAll() {
            if (!TITLE_CONTAINER.classList.contains('multi-select')) return;
            const totalItem = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay'));
            const totalItemChecked = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay.checked'));
            if (totalItemChecked.length !== totalItem.length)
                totalItem.forEach((item) => {
                    if (!item.classList.contains('saved')) item.classList.add('checked');
                });
            else {
                totalItem.forEach((item) => {
                    item.classList.remove('checked');
                });
            }
        }
        function setSelectedMedia() {
            if (TITLE_CONTAINER.classList.contains('multi-select')) {
                const totalItemsCount = DISPLAY_CONTAINER.querySelectorAll('.overlay').length;
                const selectedItemsCount = DISPLAY_CONTAINER.querySelectorAll('.overlay.checked').length;
                TITLE_CONTAINER.textContent = `Selected ${selectedItemsCount} / ${totalItemsCount}`;
            }
        }
        function hideExtension() {
            DOWNLOAD_BUTTON.setAttribute('hidden', 'true');
            DISPLAY_CONTAINER.classList.add('hide');
            DISPLAY_CONTAINER.setAttribute('style', 'display: none;');
            // Usage requestAnimationFrame to bypass transition attribute
            requestAnimationFrame(() => {
                DISPLAY_CONTAINER.removeAttribute('style');
            });
        }
        function showExtension() {
            DOWNLOAD_BUTTON.removeAttribute('hidden');
        }
        function handleChatTab() {
            const reactRoot = document.body.querySelector('[id]');
            if (!reactRoot) return;

            const updateVisibility = debounce(() => {
                const chatTabsRootContent = document.querySelector('[data-pagelet="IGDChatTabsRootContent"]');
                if (!chatTabsRootContent) {
                    showExtension();
                    return;
                }
                const visualCompletionIgnore = chatTabsRootContent.querySelector('[data-visualcompletion="ignore"]');
                if (!visualCompletionIgnore || !visualCompletionIgnore.childNodes[0]) {
                    showExtension();
                    return;
                }

                const tabChatWrapper = visualCompletionIgnore.childNodes[0];
                if (tabChatWrapper.childNodes.length > 1) {
                    const actualTabChat = tabChatWrapper.lastChild;
                    const singleTabChat = actualTabChat.querySelector('[aria-label]');

                    const isVisible = (actualTabChat && actualTabChat.checkVisibility({ checkVisibilityCSS: true })) ||
                                      (singleTabChat && singleTabChat.checkVisibility({ checkVisibilityCSS: true }));

                    if (isVisible) hideExtension();
                    else showExtension();
                } else {
                    showExtension();
                }
            }, 200);

            const rootObserver = new MutationObserver(updateVisibility);
            rootObserver.observe(reactRoot, {
                childList: true,
                subtree: true,
            });
        }
        const handleTheme = new MutationObserver(setTheme);
        const handleVideo = new MutationObserver(pauseVideo);
        const handleToggleSelectMode = new MutationObserver(toggleSelectMode);
        const handleSelectMedia = new MutationObserver(setSelectedMedia);
        handleTheme.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        handleVideo.observe(DISPLAY_CONTAINER, {
            attributes: true,
            attributeFilter: ['class'],
        });
        handleToggleSelectMode.observe(TITLE_CONTAINER, {
            attributes: true,
            attributeFilter: ['class'],
        });
        handleSelectMedia.observe(DISPLAY_CONTAINER.querySelector('.media-container'), {
            attributes: true,
            childList: true,
            subtree: true,
        });
        // --- Lock button helpers ---
        function updateLockButton(isLocked) {
            LOCK_BUTTON.textContent = isLocked ? '🔒' : '🔓';
            if (isLocked) {
                DOWNLOAD_BUTTON.style.cursor = 'pointer';
            } else {
                DOWNLOAD_BUTTON.style.cursor = 'move';
            }
        }
        // --- Load saved position and lock state ---
        function loadButtonPosition() {
            chrome.storage.local.get(['download_button_pos', 'download_button_locked'], (res) => {
                const pos = res.download_button_pos;
                if (pos) {
                    DOWNLOAD_BUTTON.style.left = pos.left;
                    DOWNLOAD_BUTTON.style.top = pos.top;
                    DOWNLOAD_BUTTON.style.right = 'auto';
                    DOWNLOAD_BUTTON.style.bottom = 'auto';
                }
                const isLocked = res.download_button_locked !== false;
                updateLockButton(isLocked);
            });
        }
        ESC_BUTTON.addEventListener('click', (e) => {
            e.stopPropagation();
            DISPLAY_CONTAINER.classList.add('hide');
            pauseVideo();
        });

        // --- Click outside to close ---
        const handleClickOutside = (e) => {
            if (DISPLAY_CONTAINER.classList.contains('hide')) return;
            // Ignore programmatic clicks from saveFile or elements not in DOM
            if (!e.target.isConnected) return; 
            
            if (DISPLAY_CONTAINER.contains(e.target)) return;
            if (DOWNLOAD_BUTTON.contains(e.target)) return;

            DISPLAY_CONTAINER.classList.add('hide');
            pauseVideo();
        };

        // Prevent duplicate listeners if script is re-injected
        if (window.__handleClickOutside) {
            document.removeEventListener('click', window.__handleClickOutside);
        }
        window.__handleClickOutside = handleClickOutside;
        document.addEventListener('click', window.__handleClickOutside);
        LOCK_BUTTON.addEventListener('click', (e) => {
            e.stopPropagation();
            const isLocked = LOCK_BUTTON.textContent === '🔓';
            chrome.storage.local.set({ 'download_button_locked': isLocked });
            updateLockButton(isLocked);
        });
        DOWNLOAD_ALL_BUTTON.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadAll();
        });
        // --- Drag listeners ---
        DOWNLOAD_BUTTON.addEventListener('mousedown', (e) => {
            chrome.storage.local.get('download_button_locked', (res) => {
                if (res.download_button_locked === false) {
                    isDragging = true;
                    hasMoved = false;
                    startX = e.clientX;
                    startY = e.clientY;
                    const rect = DOWNLOAD_BUTTON.getBoundingClientRect();
                    startLeft = rect.left;
                    startTop = rect.top;
                    DOWNLOAD_BUTTON.style.transition = 'none';
                    DOWNLOAD_BUTTON.style.cursor = 'grabbing';
                    e.preventDefault();
                }
            });
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                    hasMoved = true;
                }
                const newLeft = startLeft + dx;
                const newTop = startTop + dy;
                DOWNLOAD_BUTTON.style.left = `${newLeft}px`;
                DOWNLOAD_BUTTON.style.top = `${newTop}px`;
                DOWNLOAD_BUTTON.style.right = 'auto';
                DOWNLOAD_BUTTON.style.bottom = 'auto';
            }
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                DOWNLOAD_BUTTON.style.cursor = 'move';
                const rect = DOWNLOAD_BUTTON.getBoundingClientRect();
                const finalLeft = Math.round(rect.left);
                const finalTop = Math.round(rect.top);
                DOWNLOAD_BUTTON.style.left = `${finalLeft}px`;
                DOWNLOAD_BUTTON.style.top = `${finalTop}px`;
                // Re-enable transition after the next paint to avoid snapping
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        DOWNLOAD_BUTTON.style.transition = 'background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease';
                    });
                });
                chrome.storage.local.set({
                    'download_button_pos': {
                        left: `${finalLeft}px`,
                        top: `${finalTop}px`
                    }
                });
            }
        });
        // Click guard — prevents click from firing after a drag
        DOWNLOAD_BUTTON.addEventListener('click', (e) => {
            if (hasMoved) {
                e.stopImmediatePropagation();
                hasMoved = false;
                return;
            }
        }, true);
        // --- RESET_POSITION message from popup ---
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === "RESET_POSITION") {
                DOWNLOAD_BUTTON.style.left = '';
                DOWNLOAD_BUTTON.style.top = '';
                DOWNLOAD_BUTTON.style.right = '';
                DOWNLOAD_BUTTON.style.bottom = '';
                const rect = DOWNLOAD_BUTTON.getBoundingClientRect();
                const centerX = (window.innerWidth / 2) - (rect.width / 2);
                const centerY = (window.innerHeight / 2) - (rect.height / 2);
                DOWNLOAD_BUTTON.style.left = `${Math.round(centerX)}px`;
                DOWNLOAD_BUTTON.style.top = `${Math.round(centerY)}px`;
                DOWNLOAD_BUTTON.style.right = 'auto';
                DOWNLOAD_BUTTON.style.bottom = 'auto';
                chrome.storage.local.set({
                    'download_button_pos': {
                        left: DOWNLOAD_BUTTON.style.left,
                        top: DOWNLOAD_BUTTON.style.top
                    }
                });
            }
        });
        window.addEventListener('keydown', (e) => {
            if (window.location.pathname.startsWith('/direct')) return;
            if (IGNORE_FOCUS_ELEMENTS.includes(e.target.tagName)) return;
            if (e.target.role === 'textbox') return;
            if (e.ctrlKey) return;
            if (DOWNLOAD_EVENT_KEYS.includes(e.key)) {
                return DOWNLOAD_BUTTON.click();
            }
            if (ESC_EVENT_KEYS.includes(e.key)) {
                return ESC_BUTTON.click();
            }
            if (SELECT_EVENT_KEYS.includes(e.key) && !DISPLAY_CONTAINER.classList.contains('hide')) {
                return TITLE_CONTAINER.classList.toggle('multi-select');
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                DISPLAY_CONTAINER.querySelectorAll('video').forEach((video) => {
                    video.pause();
                });
            }
        });
        handleLongClick(
            TITLE_CONTAINER,
            () => {
                TITLE_CONTAINER.classList.toggle('multi-select');
            },
            handleSelectAll,
        );
        DOWNLOAD_BUTTON.addEventListener('click', handleDownload);
        window.addEventListener('online', () => {
            DISPLAY_CONTAINER.querySelectorAll('img , video').forEach((media) => {
                media.src = media.src;
            });
        });
        navigation.addEventListener('navigate', (e) => {
            const currentPath = new URL(e.destination.url).pathname;
            const previousPath = window.location.pathname;
            // Hide/Show Download button when user navigate
            if (currentPath.startsWith('/direct')) {
                hideExtension();
            }
            // Have to check old path because Instagram now show message button on almost every page.
            else if (previousPath.startsWith('/direct')) {
                showExtension();
            }

            // Set z-index to Download button when navigate to downloadable url
            // Download button z-index unset by default to prevent overlay over other element
            if (
                currentPath.match(IG_POST_REGEX) ||
                currentPath.match(IG_STORY_REGEX) ||
                currentPath.match(IG_HIGHLIGHT_REGEX)
            ) {
                DOWNLOAD_BUTTON.style.zIndex = '1000000';
            } else {
                DOWNLOAD_BUTTON.style.zIndex = '';
            }
        });
        window.addEventListener('userLoad', (e) => {
            if (!appCache.userIdsCache.has(e.detail.username)) {
                appCache.userIdsCache.set(e.detail.username, e.detail.id);
            }
        });
        window.addEventListener('postView', (e) => {
            if (appCache.postIdInfoCache.has(e.detail.code)) return;
            // Check valid shortcode
            if (e.detail.code.startsWith(convertToShortcode(e.detail.id))) {
                appCache.postIdInfoCache.set(e.detail.code, e.detail.id);
            }
        });
        setTheme();
        handleChatTab();
        if (window.location.pathname.startsWith('/direct')) {
            DOWNLOAD_BUTTON.setAttribute('hidden', 'true');
            DISPLAY_CONTAINER.classList.add('hide');
        }
        loadButtonPosition();
    }
    function run() {
        document.querySelectorAll('.display-container, .download-button').forEach((node) => {
            node.remove();
        });
        initUI();
        handleEvents();
    }
    run();
})();
