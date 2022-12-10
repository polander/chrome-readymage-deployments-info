const NODE_NAME_INPUT = 'INPUT';
const CHECKBOX_TYPE = 'checkbox';
const form = document.getElementById('options-form');

function populateOptionsFields() {
    const dataFields = Array.from(form.elements).reduce((acc, { nodeName, id }) => (
        nodeName === NODE_NAME_INPUT ? [ ...acc, id ] : acc
    ), []);

    chrome.storage.sync.get(dataFields, (data) => {
        dataFields.forEach(field => {
            const value = data[field];
            const input = document.getElementById(field);

            if (data[field] !== undefined && input) {
                input.value = value;
                input.checked = value;
            }
        });
    });
}

populateOptionsFields();

function saveSettings(e) {
    if (e) {
        e.preventDefault();
    }

    const newSettings = Array.from(form.elements).reduce((acc, inputField) => {
        const { nodeName, id, value: inputValue, checked, type } = inputField;
        const value = type === CHECKBOX_TYPE ? checked : inputValue;

        return nodeName === NODE_NAME_INPUT ? { ...acc, [id]: value } : acc
    }, {});

    chrome.storage.sync.set(newSettings);
    document.getElementById('saved-notice').style.display = 'block';
}

form.addEventListener('submit', saveSettings);
