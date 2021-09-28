class RequestTable {

    constructor(wrapper, columns) {
        const table = document.createElement('table');
        const tableHead = document.createElement('thead');
        const tableHeadRow = document.createElement('tr');
        const tableBody = document.createElement('tbody');

        columns.filter(x => !x.hidden).forEach(column => {
            const tableColumn = document.createElement('th');
            tableColumn.textContent = column.name;

            tableHeadRow.appendChild(tableColumn);
        })

        tableHead.appendChild(tableHeadRow);
        table.appendChild(tableHead);
        table.appendChild(tableBody);
        wrapper.appendChild(table);

        this.table = tableBody;
        this.columns = columns;
    }

    addRequest(requestData) {
        const requestEntryRow = document.createElement('tr');

        requestEntryRow.dataset.request = JSON.stringify(requestData);

        if (requestData.response._error || requestData.response.status > 399 || requestData.response.status === 0) {
            requestEntryRow.classList.add('network-error-row');
        }

        this.columns.filter(x => !x.hidden).forEach(column => {
            const requestEntryColumn = document.createElement('td');
            requestEntryColumn.innerHTML = column.render ? column.render(column.data(requestData)) : column.data(requestData);

            if (column.tooltip && typeof column.tooltip === 'function' && column.tooltip(requestData) !== null) {
                requestEntryColumn.setAttribute('title', column.tooltip(requestData));
            }

            if (column.onDbClick && typeof column.onDbClick === 'function') {
                requestEntryColumn.addEventListener('dblclick', column.onDbClick.bind(null, requestData));
            }

            requestEntryRow.appendChild(requestEntryColumn);
        });

        this.table.appendChild(requestEntryRow);
    }

    clearEntries() {
        this.table.textContent = '';
    }

    getTableBody() {
        return this.table;
    }
}