const innerText = `Readymage deployment info v${chrome.runtime.getManifest().version}`;
document.getElementById(
    'popup-message'
).innerText = innerText;

chrome.identity.getAuthToken({ interactive: false }, (token) => {
    chrome.storage.local.set({ access_token: token });

    chrome.identity.getProfileUserInfo((info) => {
        const { email } = info;
        if (email) {
            chrome.storage.sync.set({ name: email.replace(/@(.*)/, '') });
        }
    });

    document.getElementById(
        'popup-message'
    ).innerText = innerText + (!!token ? ' LOGGED IN' : ' NOT LOGGED IN');
});
