document.getElementById('resetPosition').addEventListener('click', () => {
    chrome.storage.local.remove('download_button_pos', () => {
        chrome.tabs.query({ url: "*://*.instagram.com/*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: "RESET_POSITION" });
            });
        });

        const btn = document.getElementById('resetPosition');
        const originalText = btn.textContent;
        btn.textContent = 'Resetting...';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = 'Done!';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1000);
        }, 500);
    });
});
