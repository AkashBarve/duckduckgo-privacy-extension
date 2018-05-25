/* global safari:false */
let context

if (safari &&
        safari.extension &&
        safari.extension.globalPage &&
        safari.extension.globalPage.contentWindow) {
    context = 'popup'
} else if (safari &&
        safari.self &&
        safari.self.tab) {
    context = 'extensionPage'
} else {
    throw new Error('safari-ui-wrapper couldn\'t figure out the context it\'s in')
}

let sendOptionsMessage = (message, resolve, reject) => {
    if (message.whitelisted) {
        resolve(safari.self.tab.dispatchMessage('whitelisted', message))
    } else if (message.getSetting) {
        // send message random ID so we know which promise to res
        let id = Math.random()
        message.id = id
        safari.self.tab.dispatchMessage('getSetting', message)

        safari.self.addEventListener('message', (e) => {
            if (e.name === 'getSetting' && e.message.id === id) {
                delete e.message.id
                resolve(e.message.data)
            }
        }, true)
    } else if (message.updateSetting) {
        resolve(safari.self.tab.dispatchMessage('updateSetting', message))
    }
}

let reloadTab = () => {
    var activeTab = window.safari.application.activeBrowserWindow.activeTab
    activeTab.url = activeTab.url
}

let closePopup = () => {
    window.safari.self.hide()
}

let fetch = (message) => {
    return new Promise((resolve, reject) => {
        console.log(`Safari Fetch: ${JSON.stringify(message)}`)
        if (context === 'popup') {
            safari.extension.globalPage.contentWindow.message(message, resolve)
        } else if (context === 'extensionPage') {
            sendOptionsMessage(message, resolve, reject)
        }
    })
}

let backgroundMessage = (thisModel) => {
    // listen for messages from background
    safari.self.addEventListener('message', (req) => {
        if (req.whitelistChanged) {
            // notify subscribers that the whitelist has changed
            thisModel.set('whitelistChanged', true)
        } else if (req.updateTrackerCount) {
            thisModel.set('updateTrackerCount', true)
        }
    })
}

let getBackgroundTabData = () => {
    return new Promise((resolve) => {
        fetch({getCurrentTab: true}).then((tab) => {
            if (tab) {
                let tabCopy = JSON.parse(JSON.stringify(tab))
                resolve(tabCopy)
            } else {
                resolve()
            }
        })
    })
}

let createBrowserTab = (url) => {
    safari.application.activeBrowserWindow.openTab().url = `${url}&bext=safari`
    safari.self.hide()
}

let getExtensionURL = (path) => {
    return safari.extension.baseURI + path
}

let openExtensionPage = (path) => {
    // Chrome needs an opening slash, Safari breaks if you add it
    if (path.indexOf('/') === 0) {
        path = path.substr(1)
    }

    let url = getExtensionURL(path)

    if (context === 'popup') {
        let tab = safari.application.activeBrowserWindow.openTab()
        tab.url = url
        safari.self.hide()
    } else {
        // note: this will only work if this is happening as a direct response
        // to a user click - otherwise it'll be blocked by Safari's popup blocker
        window.open(url, '_blank')
    }
}

let openOptionsPage = () => {
    openExtensionPage('/html/options.html')
}

let getExtensionVersion = () => {
    return safari.extension.displayVersion
}

module.exports = {
    fetch: fetch,
    reloadTab: reloadTab,
    closePopup: closePopup,
    backgroundMessage: backgroundMessage,
    getBackgroundTabData: getBackgroundTabData,
    createBrowserTab: createBrowserTab,
    openOptionsPage: openOptionsPage,
    openExtensionPage: openExtensionPage,
    getExtensionURL: getExtensionURL,
    getExtensionVersion: getExtensionVersion
}
