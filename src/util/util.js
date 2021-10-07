const STATUS_CODE = Object.freeze({
    "100": "Continue",
    "101": "Switching Protocols",
    "102": "Processing",
    "103": "Early Hints",
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "203": "Non-Authoritative Information",
    "204": "No Content",
    "205": "Reset Content",
    "206": "Partial Content",
    "208": "Already Reported",
    "226": "IM Used",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "305": "Use Proxy",
    "306": "Switch Proxy",
    "307": "Temporary Redirect",
    "308": "Permanent Redirect",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Payload Too Large",
    "414": "URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Range Not Satisfiable",
    "417": "Expectation Failed",
    "418": "I'm a teapot",
    "421": "Misdirected Request",
    "422": "Unprocessable Entity",
    "425": "Too Early",
    "426": "Upgrade Required",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "431": "Request Header Fields Too Large",
    "451": "Unavailable For Legal Reasons",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "510": "Not Extended",
    "511": "Network Authentication Required"
});

function getFormattedSize(requestData) {
    const transferSize = requestData.response?._transferSize;
    const fromCache = requestData._fromCache;

    // TODO use this: https://github.com/ChromeDevTools/devtools-frontend/blob/04d4b64221e472bcbd5d1de16bef59c2cb9f8d02/front_end/core/sdk/NetworkRequest.ts#L638

    if (fromCache) {
        return (
            `
                <span class="network-table-subtle">
                   (${fromCache} cache) 
                </span>
            `
        );
    }

    if (!transferSize) {
        return '0 B';
    } else if (transferSize < 1000) {
        return `${transferSize} B`;
    } else {
        return `${(transferSize / 1000).toFixed(1)} kB`;
    }

}

/** Slightly modified version from
 * https://github.com/ChromeDevTools/devtools-frontend/blob/04d4b64221e472bcbd5d1de16bef59c2cb9f8d02/front_end/core/i18n/time-utilities.ts#L48
 * */
function getFormattedTime(ms) {
    if (!isFinite(ms)) {
        return '-';
    }

    if (ms === 0) {
        return '0';
    }

    if (ms < 1000) {
        return `${ms.toFixed(0)} ms`;
    }

    const seconds = ms / 1000;
    if (seconds < 60) {
        return `${seconds.toFixed(2)} s`;
    }

    const minutes = seconds / 60;
    if (minutes < 60) {
        return `${minutes.toFixed(1)} min`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
        return `${hours.toFixed(1)} hrs`;
    }

    const days = hours / 24;
    return `${days.toFixed(1)} days`;
}