# Permission justifications

Paste each paragraph into the matching field on the Privacy tab.

## activeTab

Pixaloy needs access to the current tab only after the user clicks the toolbar icon. The click grants temporary access to that one tab, so Pixaloy can read the page's elements and computed styles to show the inspector. Pixaloy has no access to any other tab or site.

## scripting

When the user clicks the toolbar icon, Pixaloy uses `chrome.scripting.executeScript` to add its inspector script to the current tab. The script is bundled in the extension package. Pixaloy does not inject anything until the user clicks.

## storage

Pixaloy uses `chrome.storage` to keep the user's Pixaloy settings on the device. It does not store page content, and nothing leaves the device.

## Host permissions

None. Pixaloy declares no host permissions and no content scripts that match URLs. It runs only on the tab where the user clicks the icon, through `activeTab`.

## Remote code

Answer "No, I am not using remote code". All JavaScript ships inside the extension package. Pixaloy makes no network requests and loads no external scripts, `eval` strings, or WebAssembly from a server.

## Data usage

Pixaloy reads page content (elements and their styles) on the active tab to show it to the user. Per the CWS User Data FAQ, tick "Website content" if the dashboard requires it for that reading, and state that the data is processed locally and never collected or sent. Tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.
