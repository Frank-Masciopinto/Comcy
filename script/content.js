console.log("COMCY --- Content.js is injected!")

const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  console.log(request)
  if(request.message == "open_side_panel"){
      console.log(request.message);
      toggle();
      sendResponse({mess: "DONE"})
  }
})

let all_Cards_Array = []
let all_Cards_Containers;
let ebay_secret_Auth = "v^1.1#i^1#p^3#I^3#f^0#r^0#t^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"
//Test If Browsing a Collection - Then Collect all cards info & look for Profits on Ebay
if (document.getElementById("cardexplorer")) {
  get_All_Cards_Info()
}
else if (window.name == "add_to_cart") {
  //Add to cart then close window
  add_to_cart()
}

function notify(title, description) {
  chrome.runtime.sendMessage({message: "create_notification", title: title, description: description})
}

async function get_All_Cards_Info() {
  console.log("get_All_Cards_Info()")
  notify("Comcy - Started Comparing Prices on Ebay", 'Hold on, Im looking for Profits!')
  //Get All Cards
  all_Cards_Containers = document.querySelectorAll(".cardInfoWrapper")
  //Collecting All Cards Info, fetch Ebay price, display it, the if profit margin match or above user chosen
  for (let i = 0; i < all_Cards_Containers.length; i++) {
    let card_Info = {}
    card_Info.index = i
    card_Info.title = all_Cards_Containers[i].querySelector(".title").innerText
    card_Info.description = all_Cards_Containers[i].querySelector(".description").innerText
    card_Info.list_Price = all_Cards_Containers[i].querySelector(".listprice").querySelector("a").innerText
    card_Info.href = all_Cards_Containers[i].querySelector("a").href
    all_Cards_Array.push(card_Info)
    card_Info = await fetch_ebay_price(card_Info)
    card_Info.PL = card_Info.ebay_Price - parseFloat(card_Info.list_Price.replace("$", ""))
    await add_Ebay_Price_PL_in_Comc(card_Info)
    //If Ebay Price is above the margin value set by user -> open product page and add to cart
    if (card_Info.PL >= await LS.getItem("margin_Value_State")) {
      notify("Comcy - Adding to Cart Profitable Card", `$$$ ${card_Info.title} $$$`)
      await open_card_page_wait_added_to_cart(card_Info)
    }
  }
}

async function fetch_ebay_price(card_obj) {
  console.log("fetch_ebay_price()")
  console.log(card_obj.title)
  return new Promise((res, rej) => {
    let description = card_obj.description.match(/.*(?= \-)/)[0]
    let title = card_obj.title.includes(" [") ? card_obj.title.match(/.*(?= \[)/)[0] : card_obj.title
    let ebay_searh_keywords = title + " " + description
    var ebay_API_Search_Item_Price = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${ebay_searh_keywords}&limit=3`;
    var ebay_Request = new XMLHttpRequest();
    ebay_Request.open('GET', ebay_API_Search_Item_Price);
    ebay_Request.setRequestHeader('Accept','application/json');
    ebay_Request.setRequestHeader('Content-type','application/json');
    ebay_Request.setRequestHeader('Authorization','Bearer ' + ebay_secret_Auth);
    ebay_Request.send();
    ebay_Request.onreadystatechange = function() {//Call a function when the state changes.
      if (this.readyState == 4 && this.status == 200) {
        console.log(ebay_Request.response)
        let json = JSON.parse(ebay_Request.response)
        let itemSummaries = json.itemSummaries
        let prices = []
        for (let i = 0; i < itemSummaries.length; i++) {
          prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
        }
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = (sum / prices.length) || 0;
        console.log(`The average price for ${ebay_searh_keywords} is: ${avg}.`);
        card_obj.ebay_Price = avg.toFixed(2);
        res(card_obj);
      }
    }
  })
}

async function add_Ebay_Price_PL_in_Comc(card_obj) {
  return new Promise((res, rej) => {
    console.log(card_obj.PL)
    const ebay_Price_Div = document.createElement("div");
    ebay_Price_Div.innerText = "Ebay Price: " + card_obj.ebay_Price
    const ebay_PL = document.createElement("div");
    ebay_PL.innerText = "Profit/Loss: " + card_obj.PL
    if (card_obj.PL > 0) {
      ebay_PL.className = "green-profit"
    }
    else {
      ebay_PL.className = "red-loss"
    }
    all_Cards_Containers[card_obj.index].querySelector(".carddata").appendChild(ebay_Price_Div)
    all_Cards_Containers[card_obj.index].querySelector(".carddata").appendChild(ebay_PL)
    res()
  })
}

async function open_card_page_wait_added_to_cart(card_obj) {
  return new Promise(async (res, rej) => {
    console.log(card_obj)
    //opening card page to add to cart
    window.open(card_obj.href, "add_to_cart", "height=100,width=200", "_blank");
    async function wait_card_is_added_to_cart() {
      return new Promise((res, rej) => {
        setInterval(async () => {
          if (await LS.getItem("added_to_cart?") == true) {
            await LS.setItem("added_to_cart?", false)
            res()
          }
        }, 1500);
      })
    }
    await wait_card_is_added_to_cart()
    res()
  })
}


async function add_to_cart() {
  document.querySelector(".addtocart").click()
  await LS.setItem("added_to_cart?", true)
  window.close()
}