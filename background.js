const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log(request)
    if (request.method === 'captured') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'Images/128.png',
            title: `Huyp`,
            message: 'Looking for similar products...',
            priority: 1
        })
        capture(request).then(a => save(a, sender.tab)).catch(e => {
        console.warn(e);
        notify(e.message || e);
        sendResponse({mess: "DONE"})
        });
    }
})


chrome.runtime.onInstalled.addListener(async (details) => {
    if(details.reason == "install"){
        console.log("ONINSTALL STORAGE SET UP")

}});
