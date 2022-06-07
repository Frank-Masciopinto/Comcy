const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log(request)
    if (request.message == 'create_notification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'Images/128.png',
            title: request.title,
            message: request.description,
            priority: 1
        })
        sendResponse({mess: "DONE"})
    }
})


chrome.runtime.onInstalled.addListener(async (details) => {
    if(details.reason == "install"){
        console.log("ONINSsTALL STORAGE SET UP")

}});
