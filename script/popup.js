const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };
let margin_Value_State;
async function fetch_state() {
    margin_Value_State = await LS.getItem("margin_Value_State");
    return;
}
fetch_state().then((res) => {
    console.log(margin_Value_State)
    let profit_Margin = document.getElementById("profit-margin-input")
    profit_Margin.value = margin_Value_State
    profit_Margin.addEventListener('change', async (event) => {
        await LS.setItem("margin_Value_State", profit_Margin.value) 
    })
})
