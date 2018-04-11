let fetch = ((message) => {
    return new Promise((resolve, reject) => {
        window.chrome.runtime.sendMessage(message, (result) => resolve(result))
    })
})

let backgroundMessage = (() => {
    // listen for messages from background and
    // // notify subscribers
    window.chrome.runtime.onMessage.addListener((req) => {
        if (req.whitelistChanged) this.send('whitelistChanged')
        if (req.updateTabData) this.send('updateTabData')
        if (req.didResetTrackersData) this.send('didResetTrackersData', req.didResetTrackersData)
        if (req.closePopup) window.close()
    })
})

let getBackgroundTabData = ((thisModel) => {
    return new Promise((resolve, reject) => {
        thisModel.fetch({getCurrentTab: true}).then((tab) => {
            if (tab) {
                thisModel.fetch({getTab: tab.id}).then((backgroundTabObj) => {
                    resolve(backgroundTabObj)
                })
            }
        })
    })
})

let createBrowserTab = ((url) => {
    window.chrome.tabs.create({url: `${url}&bext=${window.localStorage['os']}cr`})
})

let getExtensionURL = ((path) => {
    return chrome.extension.getURL(path)
})

let openOptionsPage = ((browser) => {
    if (browser === 'moz') {
        window.chrome.tabs.create({url: getExtensionURL('/html/options.html')})
        window.close()
    } 
    else if (browser === 'chrome'){
        window.chrome.runtime.openOptionsPage()
    }
})

let getExtensionVersion = (() => {
    const manifest = window.chrome && chrome.runtime.getManifest()
    return manifest.version
})

module.exports = {
    fetch: fetch,
    backgroundMessage: backgroundMessage,
    getBackgroundTabData: getBackgroundTabData,
    createBrowserTab: createBrowserTab,
    openOptionsPage: openOptionsPage,
    getExtensionURL: getExtensionURL,
    getExtensionVersion: getExtensionVersion
}
