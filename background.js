const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
let ebay_API_token_login = "https://api.ebay.com/identity/v1/oauth2/token"
let app_credentials = btoa("Francesc-Comcy-PRD-3b4446ab8-52a76f32:PRD-b4446ab8399b-f991-4154-ae42-1e34")
let FILTER_buy_now = ",fb"
let FILTER_lowest_price_first =",sl"
let CATEGORIES_LINKS = {
    SPORT: [
        "https://www.comc.com/Cards/Baseball",
        "https://www.comc.com/Cards/Basketball",
        "https://www.comc.com/Cards/Football",
        "https://www.comc.com/Cards/Hockey",
        "https://www.comc.com/Cards/Racing",
        "https://www.comc.com/Cards/Soccer",
        "https://www.comc.com/Cards/Golf",
        "https://www.comc.com/Cards/Tennis",
        "https://www.comc.com/Cards/MMA",
        "https://www.comc.com/Cards/Boxing",
        "https://www.comc.com/Cards/Wrestling",
        "https://www.comc.com/Cards/MultiSport"
    ],
    TRADING: [
        "https://www.comc.com/Cards/Marvel",
        "https://www.comc.com/Cards/Non-Sport",
        "https://www.comc.com/Cards/Non-Sports,=Star+Wars",
        "https://www.comc.com/Cards/Non-Sports,=Star+Trek",
        "https://www.comc.com/Cards/Non-Sports,=Garbage+Pail+Kids,sl",
        "https://www.comc.com/Cards/Poker"
    ],
    GAMING: [
        "https://www.comc.com/Cards/Magic",
        "https://www.comc.com/Cards/Pokemon",
        "https://www.comc.com/Cards/YuGiOh"
    ]
}

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
    else if (request.message == "call_API_GetToken") {
        call_API_GetToken(sender.tab.id)
    }
    else if (request.message == "start-automation") {
        //start_automation()
    }
})

function call_API_GetToken(tabId) {
    console.log("**Getting Token, Calling API***")
    var details = {
        "grant_type": "client_credentials",
        "scope": "https://api.ebay.com/oauth/api_scope"
    };
    
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(ebay_API_token_login, {

    // Adding method type
    method: "POST",
    headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Authorization': 'Basic ' + app_credentials
    },
    body: formBody
})

// Converting to JSON
.then(response => {
    console.log(response)
    return response.json()
})

.then(async (json) => {
    console.log(json)
    await LS.setItem("ebay_auth_token", json.access_token)
    chrome.tabs.sendMessage(tabId, {message: "New API Token Collected - Resume Searching!"})
})

.catch(function (err) {
	console.log(err)
}
)}

chrome.runtime.onInstalled.addListener(async (details) => {
    if(details.reason == "install"){
        console.log("ONINSsTALL STORAGE SET UP")
        let today_Date = new Date()
        let daily_extracted_pages = {
            DATES: [],
            PAGES: []
          }
        await LS.setItem("Pages_scraped_daily_DB", today_Date.toString());
        await LS.setItem("search_ended", false)
        await LS.setItem("Pages_scraped_daily_DB", daily_extracted_pages)
}});
