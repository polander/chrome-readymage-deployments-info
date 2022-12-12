const innerText = `Readymage deployment info v${chrome.runtime.getManifest().version}`;
document.getElementById(
    'popup-message'
).innerText = innerText;

chrome.identity.getAuthToken({ interactive: true }, (token) => {
    chrome.storage.local.set({ access_token: token });

    document.getElementById(
        'popup-message'
    ).innerText = innerText + (!!token ? ' LOGGED IN' : ' NOT LOGGED IN');
});
