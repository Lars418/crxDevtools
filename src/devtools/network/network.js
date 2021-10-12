// region vars
const REQUEST_TABLE_WRAPPER = document.getElementById('requestTableWrapper');
const BTN_CLEAR_REQUESTS = document.getElementById('btnClearRequests');
const BTN_REPEAT_REQUEST = document.getElementById('btnRepeatRequest');
const REPEAT_REQUEST_DIALOG = document.getElementById('repeatRequestDialog');
const repeatRequestDialogUrl = document.getElementById('repeatRequestDialogUrl');
const repeatRequestDialogMethod = document.getElementById('repeatRequestDialogMethod');
const repeatRequestDialog = document.getElementById('repeatRequestDialog');
const repeatRequestAuthorizationType = document.getElementById('repeatRequestAuthorizationType');
const repeatRequestAuthorizationTypeValueWrapper = document.querySelector('.repeatRequestAuthorizationTypeValueWrapper');
const apiKeyKeyInput = document.getElementById('repeatRequestAuthorizationTypeApiKeyKey');
const apiKeyValueInput = document.getElementById('repeatRequestAuthorizationTypeApiKeyValue');
const bearerTokenInput = document.getElementById('repeatRequestAuthorizationTypeBearerToken');
const basicAuthUsernameInput = document.getElementById('repeatRequestAuthorizationTypeBasicAuthUsername');
const basicAuthPasswordInput = document.getElementById('repeatRequestAuthorizationTypeBasicAuthPassword');
const { getMessage } = chrome.i18n;
const MOUSE_POSITION = {
    x: 0,
    y: 0
};
const menuItemMapping = {
    '1': 'repeatRequest'
};

const mimeTypeMapping = {
    'none': null,
    'formData': 'multipart/form-data',
    'xWwwFormUrlencoded': 'application/x-www-form-urlencoded',
    'binary': 'application/octet-stream',
    'graphQl': 'application/json',
    'rawJson': 'application/json',
    'rawHtml': 'text/html',
    'rawXml': 'text/xml',
    'rawJs': 'application/javascript',
    'rawText': 'text/plain'
};
// endregion

// region init
    chrome.contextMenus.onClicked.addListener((info) => {
        switch (menuItemMapping[info.menuItemId]) {
            case 'repeatRequest': (() => {
                    const entry = document.elementFromPoint(MOUSE_POSITION.x, MOUSE_POSITION.y)?.closest('tr');

                    if (!entry) {
                        return;
                    }

                    const data = JSON.parse(entry.dataset.request);

                    openRepeatRequestDialog(data);
                })();
                break;
            default:
                return;
        }
    })
    chrome.devtools.network.onRequestFinished.addListener(appendRequest);
    chrome.devtools.network.onNavigated.addListener(clearRequests);
    BTN_CLEAR_REQUESTS.addEventListener('click', clearRequests.bind(null, true));
    BTN_REPEAT_REQUEST.addEventListener('click', () => {
        const selectedRequest = REQUEST_TABLE.getSelectedRequest();

        if (!selectedRequest) {
            BTN_REPEAT_REQUEST.setAttribute('disabled', 'disabled');
            return;
        }

        const requestData = JSON.parse(selectedRequest.dataset.request);

        openRepeatRequestDialog(requestData);
    });

    const COLUMNS = [
        {
            name: "Name",
            hidden: false,
            data: row => row.request.url,
            render: cell => {
                if (!cell) {
                    return null;
                }

                const url = new URL(cell);
                const pathParts = url.pathname.split('/').filter(x => x !== '');


                if (url.href.startsWith('data:')) {
                    return cell;
                }

                if (url.pathname === '/') {
                    return url.host;
                }

                return pathParts[pathParts.length -1] + url.search;
            },
            tooltip: row => row.request.url,
            onDbClick: requestData => repeatRequest(requestData)
        },
        {
            name: "Path",
            hidden: true,
            data: row => row.request?.url ? new URL(row.request.url).pathname : null
        },
        {
            name: "URL",
            hidden: true,
            data: row => row.request?.url
        },
        {
            name: "Method",
            hidden: false,
            data: row => row.request?.method
        },
        {
            name: "Status",
            hidden: false,
            data: row => row,
            tooltip: row => (row.response?.status && row.response?.status !== 0) ? STATUS_CODE[row.response?.status] : null,
            render: cell => {
                if (cell.timings.connect === -1 && cell.response.status === 0) {
                    return '(failed)';
                }

                if (cell.response._error) {
                    return '(blocked)';
                }

                if (cell.response.status === 0) {
                    return '(blocked: DevTools)';
                }

                return cell.response?.status;
            }
        },
        {
            name: "Protocol",
            hidden: true,
            data: row => 'TBD'
        },
        {
            name: "Scheme",
            hidden: true,
            data: row => row.request?.url ? new URL(row.request.url).protocol.slice(0, -1) : null
        },
        {
            name: "Domain",
            hidden: true,
            data: row => row.request?.url ? new URL(row.request.url).host : null
        },
        {
            name: "Remote address",
            hidden: true,
            data: row => row.serverIPAddress
        },
        {
            name: "Remote address space",
            hidden: true,
            data: row => 'TBD'
        },
        {
            name: "Type",
            hidden: false,
            data: row => row._resourceType
        },
        {
            name: "Initiator",
            hidden: false,
            data: row => row?._initiator?.type,
            render: cell => {
                if (cell === 'other') {
                    return `<span class="network-table-subtle-2">Other</span>`;
                }

                return cell;
            }
        },
        {
            name: "Initiator address space",
            hidden: true,
            data: row => 'TBD (e.g. PUBLIC)'
        },
        {
            name: "Cookies",
            hidden: true,
            data: row => row?.response?.cookies?.length ?? null
        },
        {
            name: "Set cookies",
            hidden: true,
            data: row => 'TBD'
        },
        {
            name: "Size",
            hidden: false,
            data: row => row,
            render: cell => getFormattedSize(cell),
        },
        {
            name: "Time",
            hidden: false,
            data: row => Math.round(row.time - row.timings?._blocked_queueing),
            render: cell => getFormattedTime(cell),
        },
        {
            name: "Priority",
            hidden: true,
            data: row => row._priority
        },
        {
            name: "Connection Id",
            hidden: true,
            data: row => row.connection
        }
    ];
    const VISIBLE_COLUMNS_COUNT = COLUMNS.filter(column => !column.hidden).length;

    document.documentElement.style.setProperty('--visible-column-count', VISIBLE_COLUMNS_COUNT.toString());
    const REQUEST_TABLE = new RequestTable(REQUEST_TABLE_WRAPPER, COLUMNS);

    initContextMenuListener();
    initRepeatRequestDialog();
    initMutationObserver(REQUEST_TABLE.getTableBody());
// endregion

function initContextMenuListener() {
    REQUEST_TABLE.getTableBody().addEventListener('mouseenter', () => {
        chrome.contextMenus.update('1', { visible: true });
        chrome.contextMenus.update('2', { visible: true });
    });

    REQUEST_TABLE.getTableBody().addEventListener('mouseleave', () => {
        chrome.contextMenus.update('1', { visible: false });
        chrome.contextMenus.update('2', { visible: false });
    });
    document.addEventListener('mousemove', e => {
        MOUSE_POSITION.x = e.x;
        MOUSE_POSITION.y = e.y;
    })
}

// region utils
function appendRequest(requestData) {
    REQUEST_TABLE.addRequest(requestData);
}

function clearRequests(forceClear=false) {
    if (forceClear || localStorage.getItem('preserveLog') === 'false') {
        REQUEST_TABLE.clearRequests();
        BTN_REPEAT_REQUEST.setAttribute('disabled', 'disabled');
    }
}

function prepareRequestData(oldRequestData, method, url, headers, body) {
    const preparedData = {
        ...oldRequestData,
        _initiator: {
            type: `
                <abbr
                    class="network-table-initiator network-table-subtle-2"
                    title="${getMessage('extensionName')}"
                >
                    ${getMessage('extensionShortName')}
                </abbr>
            `
        },
        request: {
            ...oldRequestData.request,
            method,
            url,
            headers
        }
    };

    return preparedData;
}

function initRepeatRequestDialog() {
    const repeatRequestCloseBtns = document.querySelectorAll('.dialog-close');
    const repeatRequestPanelHeader = document.querySelector('.repeatRequestPanelHeader');
    const basicAuthPasswordInput = document.getElementById('repeatRequestAuthorizationTypeBasicAuthPassword');
    const basicAuthPasswordCheckbox = document.getElementById('repeatRequestAuthorizationTypeBasicAuthShowPassword');
    const repeatRequestBodyType = document.getElementById('repeatRequestBodyType');
    const repeatRequestBodyRawType = document.getElementById('repeatRequestBodyRawType');
    const repeatRequestBody = document.getElementById('repeatRequestBody');
    const repeatRequestSendBtn = document.getElementById('repeatRequestSend');
    const availableMethods = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'COPY', 'HEAD', 'OPTIONS', 'LINK', 'UNLINK', 'PURGE', 'LOCK', 'UNLOCK', 'PROPFIND', 'VIEW' ];
    const availablePanels = [ 'Authorization', 'Headers', 'Body' ];
    const availableAuthorizationTypes = [ 'none', 'apiKey', 'bearerToken', 'basicAuth' ];
    const availableBodyTypes = [ 'none', 'formData', 'xWwwFormUrlencoded', 'raw', 'binary', 'graphQl' ];
    const availableBodyRawTypes = [ 'text', 'js', 'json', 'html', 'xml' ];

    repeatRequestCloseBtns.forEach(btn => btn.addEventListener('click', closeRepeatRequestDialog));

    availableMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;

        repeatRequestDialogMethod.appendChild(option);
    });

    availablePanels.forEach(panel => {
        const button = document.createElement('button');
        button.textContent = getMessage(`repeatRequestDialogPanel${panel}`);
        button.classList.add('repeatRequestPanelDialogPanelButton');

        if (panel === 'Authorization') {
            button.classList.add('is-active');
            document.querySelector('div[data-panel-id="Authorization"]').classList.add('is-active');
        }

        button.addEventListener('click', () => {
            document.querySelector('.repeatRequestPanelDialogPanelButton.is-active').classList.remove('is-active');
            button.classList.add('is-active');
            document.querySelector('div[data-panel-id].is-active').classList.remove('is-active');
            document.querySelector(`div[data-panel-id="${panel}"]`).classList.add('is-active');
        });

        repeatRequestPanelHeader.appendChild(button);
    });

    availableAuthorizationTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getMessage(`authorizationType_${type}`);
        repeatRequestAuthorizationType.appendChild(option);
    });

    availableBodyTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getMessage(`bodyType_${type}`);
        repeatRequestBodyType.appendChild(option);
    });

    availableBodyRawTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getMessage(`bodyRawType_${type}`);
        repeatRequestBodyRawType.appendChild(option);
    });

    repeatRequestAuthorizationType.addEventListener('change', () => {
        repeatRequestAuthorizationTypeValueWrapper.querySelector('div[data-authorization-id].is-active')?.classList?.remove('is-active');
        repeatRequestAuthorizationTypeValueWrapper.querySelector(`div[data-authorization-id="${repeatRequestAuthorizationType.value}"]`)?.classList?.add('is-active');
    });

    basicAuthPasswordCheckbox.addEventListener('change', () => {
        const type = basicAuthPasswordInput.getAttribute('type');
        if (type === 'password') {
            basicAuthPasswordInput.setAttribute('type', 'text');
        } else {
            basicAuthPasswordInput.setAttribute('type', 'password');
        }
    });

    repeatRequestBodyType.addEventListener('change', () => {
        if (repeatRequestBodyType.value === 'raw') {
            repeatRequestBodyRawType.parentElement.style.display = 'flex';
        } else {
            repeatRequestBodyRawType.parentElement.style.display = 'none';
        }
    });

    repeatRequestSendBtn.addEventListener('click', () => {
        const selectedRequest = REQUEST_TABLE.getSelectedRequest();
        const requestData = JSON.parse(selectedRequest.dataset.request);
        const method = repeatRequestDialogMethod.value;
        const url = repeatRequestDialogUrl.value;
        let headers = Array.from(document.querySelectorAll (`div[data-panel-id="Headers"] tbody tr`))
                             .filter(entry => entry.querySelector('td input:checked') && entry.querySelector('td:nth-child(2) input').value)
                             .map(entry => {
                                const name = entry.querySelector('td:nth-child(2) input').value;
                                const value = entry.querySelector('td:nth-child(3) input').value;

                                return { name, value };
                             });
        const authorization = repeatRequestAuthorizationType.value;

        if (authorization !== 'none') {
            headers = headers.filter(header => header.name?.toLowerCase() !== 'authorization');
            headers.push({
                name: 'Authorization',
                value: getAuthorizationValue(authorization)
            });
        }
        const bodyType = repeatRequestBodyType.value === 'raw' ? `${repeatRequestBodyType.value}_${repeatRequestBodyRawType.value}` : repeatRequestBodyType.value
        const body = {
            mimeType: mimeTypeMapping[bodyType],
            text: repeatRequestBody.value
        };

        const preparedData = prepareRequestData(requestData, method, url, headers, body);
        repeatRequest(preparedData);
    });
}

function openRepeatRequestDialog(requestData) {
    document.body.style.overflowY = 'hidden';
    repeatRequestDialogMethod.value = requestData?.request?.method;
    repeatRequestDialogUrl.value = requestData?.request?.url ?? '';
    clearInputTable('Headers');

    requestData.request?.headers.filter(x => !x.name.startsWith(':')).forEach(header => {
        createInputTableEntry('Headers', header.name, header.value);
    });
    createInputTableEntry('Headers', '', '');

    const auth = getAuthorization(requestData);
    setAuthorizationValue(auth.type, auth.value);
    repeatRequestAuthorizationType.value = auth.type;
    repeatRequestAuthorizationTypeValueWrapper.querySelector('div[data-authorization-id].is-active')?.classList?.remove('is-active');
    repeatRequestAuthorizationTypeValueWrapper.querySelector(`div[data-authorization-id="${repeatRequestAuthorizationType.value}"]`)?.classList?.add('is-active');

    REPEAT_REQUEST_DIALOG.showModal();
}

function closeRepeatRequestDialog() {
    document.body.style.overflowY = null;
    repeatRequestDialog.close();
}

function createInputTableEntry(panelId, key, value) {
    const tableBody = document.querySelector(`div[data-panel-id="${panelId}"] tbody`);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <input
                type="checkbox"
                checked="checked"
                title="${getMessage('repeatRequestDialogEnableDisableHeaderTitle')}"
            >
        </td>
        <td>
            <input
                type="text"
                value="${key}"
                spellcheck="false"
                placeholder="${getMessage('repeatRequestDialogKey')}"
            >
        </td>
        <td class="input-table-last">
            <div>
                <input
                    type="text"
                    value="${value}"
                    spellcheck="false"
                    placeholder="${getMessage('repeatRequestDialogValue')}"
                >
                <button title="${getMessage('repeatRequestDialogRemoveHeader')}">
                    &times;
                </button>
            </div>
        </td>
    `;

    const removeHeaderBtn = tr.querySelector('button');

    removeHeaderBtn.addEventListener('click', () => removeInputTableEntry('Headers', tr));

    tableBody.appendChild(tr);
}

function clearInputTable(panelId) {
    const tableBody = document.querySelector(`div[data-panel-id="${panelId}"] tbody`);
    tableBody.textContent = '';
}

function removeInputTableEntry(panelId, entry) {
    const tableBody = document.querySelector(`div[data-panel-id="${panelId}"] tbody`);

    tableBody.removeChild(entry);
}

function setAuthorizationValue(type, value) {
    [apiKeyKeyInput, apiKeyValueInput, bearerTokenInput, basicAuthPasswordInput, basicAuthUsernameInput].forEach(input => {
        input.value = '';
    });

    if (type === 'apiKey') {
        if (value.includes('=')) {
            const [apiKey, apiValue] = value.split('=');
            apiKeyKeyInput.value = apiKey;
            apiKeyValueInput.value = apiValue;
        } else {
            apiKeyValueInput.value = value;
        }
    } else if (type === 'bearerToken') {
        bearerTokenInput.value = value;
    } else if (type === 'basicAuth') {
        basicAuthUsernameInput.value = value.username;
        basicAuthPasswordInput.value = value.password;
    }
}

function getAuthorizationValue(authorizationType) {
    if (authorizationType === 'apiKey') {
        if (apiKeyKeyInput.value && apiKeyValueInput.value) {
            return `${apiKeyKeyInput.value}=${apiKeyValueInput.value}`;
        }

        return apiKeyValueInput.value;
    }

    if (authorizationType === 'bearerToken') {
        return `Bearer ${bearerTokenInput.value}`;
    }

    if (authorizationType === 'basicAuth') {
        return `Basic ${window.btoa(`${basicAuthUsernameInput.value}:${basicAuthPasswordInput.value}`)}`;
    }
}

function initMutationObserver(target) {
    const config = { attributes: true, subtree: true };
    const callback = (mutations) => {
        for (const mutation of mutations) {
            const { type, attributeName, target: { tagName, classList } } = mutation;

            if (type === 'attributes' && attributeName === 'class' && tagName.toLowerCase() === 'tr' && classList.contains('network-row-selected')) {
                BTN_REPEAT_REQUEST.removeAttribute('disabled');
            } else {
                BTN_REPEAT_REQUEST.setAttribute('disabled', 'disabled');
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(target, config);
}

function repeatRequest(requestData) {
    const { method, url, headers, postData } = requestData.request;
    const preparedHeaders = Object.fromEntries(headers.filter(x => !x.name.startsWith(':')).map(x => [x.name, x.value]));
    const modifiedRequestData = {
        ...requestData,
        _initiator: {
            type: `
                <abbr
                    class="network-table-initiator network-table-subtle-2"
                    title="${getMessage('extensionName')}"
                >
                    ${getMessage('extensionShortName')}
                </abbr>
            `
        },
        time: -1,
        timings: {
            blocked: 0,
            dns: -1,
            ssl: -1,
            connect: -1,
            send: 0,
            wait: 0,
            receive: 0,
            _blocked_queueing: 0
        }
    }

    fetch(url, {
        method,
        headers: preparedHeaders,
        body: postData?.text ?? undefined
    }).then(res => {
        modifiedRequestData.response = {
            status: res.status,
            statusText: res.statusText,
            httpVersion: '',
            headers: res.headers,
            cookies: [],
            redirectURL: '',
            headersSize: -1, // res.headers.length === 0 ? -1 : res.headers.length,
            bodySize: -1, // res.bodyUsed ? 0 : -1,
            _error: null
        };

        REQUEST_TABLE.addRequest(modifiedRequestData);
    }).catch(err => {
        modifiedRequestData.response = {
            status: res.status,
            statusText: res.statusText,
            httpVersion: '',
            headers: res.headers,
            cookies: [],
            redirectURL: '',
            headersSize: -1, // res.headers.length === 0 ? -1 : res.headers.length,
            bodySize: -1, // res.bodyUsed ? 0 : -1,
            _error: err.toString()
        };

        REQUEST_TABLE.addRequest(modifiedRequestData);
    });
    closeRepeatRequestDialog();
}

// endregion