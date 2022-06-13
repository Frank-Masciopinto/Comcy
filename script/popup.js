const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
function notify(title, description) {
    chrome.runtime.sendMessage({message: "create_notification", title: title, description: description})
}
let margin_Value_State;
let min_price;
let max_price;
async function fetch_state() {
    margin_Value_State = await LS.getItem("margin_Value_State");
    min_price = await LS.getItem("min_price")
    max_price = await LS.getItem("max_price")
    return;
}

fetch_state().then((res) => {
    console.log(margin_Value_State)
    let profit_Margin = document.getElementById("profit-margin-input")
    profit_Margin.value = margin_Value_State
    profit_Margin.addEventListener('change', async (event) => {
        await LS.setItem("margin_Value_State", profit_Margin.value) 
    })
    let min_price_input = document.getElementById("min_price")
    min_price_input.value = min_price
    min_price_input.addEventListener('change', async (event) => {
        await LS.setItem("min_price", min_price_input.value) 
    })
    let max_price_input = document.getElementById("max_price")
    max_price_input.value = max_price
    max_price_input.addEventListener('change', async (event) => {
        await LS.setItem("max_price", max_price_input.value) 
    })
})

let start_automation_btn = document.getElementById("start-automation")
start_automation_btn.addEventListener('click', async (event) => {
    if (margin_Value_State == (undefined||"") || min_price == (undefined||"") || max_price == (undefined||"")) {
        alert("Fill up all the required fields in the popup, before automation can start.")
    }
    else {
        window.open("https://www.comc.com/", "start_automation")
    }
})