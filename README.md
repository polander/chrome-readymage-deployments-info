# chrome-readymage-deployments-info

This Chrome add-on adds additional info to readymage deployments panel such as executor and description. It uses google sheets as a database, therefore requires oauth authentication at first to obtain an access token.

Installation:

- Clone repository (or download ZIP if you don't have git installed and extract it).
- Go to chrome://extensions/
- Press 'Load unpacked' and select cloned repo
- Open extensions dropdown right to the address bar and click on the extension
- You will be reuired to login to your google account, it will also automatically add your name to extension settings
- Now go to readymage panel and you should see additional deployments info, you will be also promted to input deployment description each time you press 'Start deployment' button

Update:
- git pull (or download fresh ZIP of you don't have git installed)
- Go to chrome://extensions/
- click on 'reload' icon inside the extension card
