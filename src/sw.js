const { INSTALL, UPDATE } = chrome.runtime.OnInstalledReason;

chrome.runtime.onInstalled.addListener(e => {
    initContextMenu();

    if (e.reason === INSTALL) {
        chrome.runtime.setUninstallURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }
});

chrome.runtime.onStartup.addListener(() => {
    initContextMenu();
});

function initContextMenu() {
    chrome.contextMenus.create({
        id: '1',
        contexts: [ 'page', 'selection' ],
        title: 'Repeat request',
        visible: false
    });

    chrome.contextMenus.create({
       id: '2',
       contexts: [ 'page', 'selection' ],
       title: 'Copy',
       visible: false
    });

    chrome.contextMenus.create({
        id: '3',
        contexts: [ 'page', 'selection' ],
        title: 'Copy link address',
        parentId: '2'
    });

    chrome.contextMenus.create({
        id: '4',
        contexts: [ 'page', 'selection' ],
        title: 'Copy response',
        parentId: '2'
    });
}