chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get([
        'name',
        'spreadsheet_id',
        'ignored_fields'
    ], (data) => {
        const {
            name = '',
            spreadsheet_id = '1fV4Zmg3TxcUPqwfOsF8AKc5C2qabjCZhpfLAnCKuVII',
            ignored_fields = 'date'
        } = data;

        chrome.storage.sync.set({
            name,
            spreadsheet_id,
            ignored_fields
        });
    });

    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        chrome.storage.local.set({ access_token: token });
    
        chrome.identity.getProfileUserInfo(({ email } = {}) => {
            if (email) {
                chrome.storage.sync.set({ name: email.replace(/@(.*)/, '') });
            }
        });
    });
});

chrome.identity.getAuthToken({ interactive: false }, (token) => {
    chrome.storage.local.set({ access_token: token });
});

function onReadymageTabActive() {
    const spreadsheetApiBase = "https://sheets.googleapis.com/v4/spreadsheets/";
    const dataPrefix = '__rmgdi_';
    const rmgDefaultFieldCount = 3;
    const tabNumber = 3;
    const refreshInterval = 1000;
    const deploymentTimeMaxDelayInSeconds = 3;
    const deploymentButtonText = 'start deployment';

    function setWindowData(key, value) {
        window[dataPrefix + key] = value;
    }

    function getWindowData(key) {
        return window[dataPrefix + key];
    }

    if (!getWindowData('deployments_info')) {
        setWindowData('deployments_info', {});
    }

    function getCurrentInstance() {
        return document.getElementsByClassName('instance-select')[0].value;
    }

    function refreshDeploymentsInfo(refetchInfo = false) {
        chrome.storage.local.get(["access_token"], ({ access_token }) => {
            chrome.storage.sync.get(['spreadsheet_id', 'ignored_fields'], (data) => {
                const { spreadsheet_id, ignored_fields } = data;
                const ignoredFields = ignored_fields.split(',');
                const deploymentsPanel = document.getElementsByClassName('tab-pane')[tabNumber];

                if (deploymentsPanel && deploymentsPanel.className.includes('active')) {
                    const thead = deploymentsPanel.querySelector('thead tr');
                    const tbody = deploymentsPanel.getElementsByTagName('tbody')[0];

                    if (thead && tbody) {
                        const currentInstance = getCurrentInstance();
                        const deploymentsInfo = getWindowData('deployments_info')[currentInstance];

                        if (deploymentsInfo === undefined || refetchInfo) {
                            setWindowData('deployments_info', { ...getWindowData('deployments_info'), [currentInstance]: false });
                            fetch(
                                spreadsheetApiBase + spreadsheet_id + '/values/' + currentInstance,
                                {
                                    headers: {
                                        Authorization: 'Bearer ' + access_token,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            ).then((response) => response.json()).then(function({ values }) {
                                if (!values || values.length < 2) {
                                    return;
                                }

                                const [fields, ...rows] = values;
                                const records = rows.reduce((acc, row) => {
                                    const rowObject = row.reduce((acc, value, idx) => {
                                        return { ...acc, [fields[idx]]: value };
                                    }, {});

                                    return { ...acc, [rowObject.date]: rowObject };
                                }, {});

                                setWindowData('deployments_info', { ...getWindowData('deployments_info'), [currentInstance]: { records, fields } });
                            });
                            return;
                        }

                        if (!deploymentsInfo || !Object.values(deploymentsInfo.records).length) {
                            return;
                        }

                        const ths = thead.getElementsByTagName('th');
                        if (ths.length <= rmgDefaultFieldCount) {
                            deploymentsInfo.fields.forEach((field) => {
                                if (ignoredFields.includes(field)) {
                                    return;
                                }

                                const th = document.createElement('th');
                                th.innerText = field.charAt(0).toUpperCase() + field.slice(1);
                                thead.appendChild(th);
                                if (field === 'description') th.style.minWidth = '200px';
                            });
                        }

                        const trs = [...tbody.getElementsByTagName('tr')];
                        trs.forEach((tr) => {
                            const tds = tr.getElementsByTagName('td');

                            if (tds.length > rmgDefaultFieldCount) {
                                return;
                            }

                            const date = new Date(tds[0].innerText);
                            let i = 0;
                            while (i <= deploymentTimeMaxDelayInSeconds && !deploymentsInfo.records[date.toLocaleString()]) {
                                date.setSeconds(date.getSeconds() - 1);
                                i++;
                            }
 
                            const record = deploymentsInfo.records[date.toLocaleString()];

                            if (record) {
                                Object.entries(record).forEach(([key, value]) => {
                                    if (ignoredFields.includes(key)) {
                                        return;
                                    }
                                    const td = document.createElement('td');
                                    td.innerText = value;
                                    tr.appendChild(td);
                                    td.style.paddingRight = '20px';
                                });
                            }
                        });
                    }
                }
            });
        });
    }

    function onDeploymentButtonClick() {
        const currentInstance = getCurrentInstance();
        const date = new Date().toLocaleString();

        chrome.storage.local.get(["access_token"], ({ access_token }) => {
            chrome.storage.sync.get(['spreadsheet_id', 'name'], (data) => {
                const { spreadsheet_id, name } = data;
                const description = prompt('Enter deployment description:');
                const params = {
                    values: [
                        [date, name, description]
                    ]
                };

                fetch(
                    spreadsheetApiBase + spreadsheet_id + '/values/' + currentInstance + ':append?insertDataOption=INSERT_ROWS&valueInputOption=RAW',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer ' + access_token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(params)
                    }
                ).then(() => refreshDeploymentsInfo(true));
            });
        });
    }

    if (!getWindowData('refresh_interval')) {
        setWindowData('refresh_interval', setInterval(() => {
            refreshDeploymentsInfo();

            const button = Array.from(document.getElementsByTagName('button')).find(
                ({ innerText }) => innerText.toLowerCase().includes(deploymentButtonText)
            );

            if (button && button.getAttribute(dataPrefix + 'listener') !== 'true') {
                button.addEventListener('click', onDeploymentButtonClick);
                button.setAttribute(dataPrefix + 'listener', 'true');
            }
        }, refreshInterval));
    }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async (tab) => {
        if (tab.url.includes('portal.readymage')) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: onReadymageTabActive,
            });
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url.includes('portal.readymage')) {
        chrome.scripting.executeScript({
            target: { tabId },
            function: onReadymageTabActive,
        });
    }
});
