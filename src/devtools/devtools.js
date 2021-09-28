const title = chrome.i18n.getMessage('extensionShortName');

chrome.devtools.panels.create(
    title,
    null,
    "devtools/network/network.html",
    panel => {
        panel.onHidden.addListener(() => {
            chrome.contextMenus.update('1', { visible: false });
            chrome.contextMenus.update('2', { visible: false });
        });
    }
);