console.log("COMCY --- Content.js is injected!")

const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  console.log(request)
  if(request.message == "New API Token Collected - Resume Searching!"){
      get_All_Cards_Info()
      sendResponse({mess: "DONE"})
  }
})

let all_Cards_Array = []
let all_Cards_Containers;
let ebay_secret_Auth;
console.log("Window_Name = " + window.name)
let ebay_API_token_login = "https://api.ebay.com/identity/v1/oauth2/token"
let app_credentials = btoa("Francesc-Comcy-PRD-3b4446ab8-52a76f32:PRD-b4446ab8399b-f991-4154-ae42-1e34")

//Test If Browsing a Collection - Then Collect all cards info & look for Profits on Ebay
if (document.getElementById("cardexplorer")) {
  notify("Comcy - Started Comparing Prices on Ebay", 'Hold on, Im looking for Profits!')
  get_All_Cards_Info()
}
else if (window.name == "add_to_cart") {
  console.log("Adding to Cart...")
  //Add to cart then close window
  add_to_cart()
}
else if (window.name == "get_token") {
  update_token()
}

function notify(title, description) {
  chrome.runtime.sendMessage({message: "create_notification", title: title, description: description})
}

async function get_All_Cards_Info() {
  console.log("get_All_Cards_Info()")
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
    if (card_Info.items_found_on_ebay) {
      card_Info.PL = card_Info.ebay_Price - parseFloat(card_Info.list_Price.replace("$", ""))
      await add_Ebay_Price_PL_in_Comc(card_Info)
      //If Ebay Price is above the margin value set by user -> open product page and add to cart
      if (card_Info.PL >= await LS.getItem("margin_Value_State")) {
        notify("Comcy - Adding to Cart Profitable Card", `$$$ ${card_Info.title} $$$`)
        await open_card_page_wait_added_to_cart(card_Info)
      }
    }
    else {
      add_not_found_on_ebay(card_Info)
    }
  }
}

async function fetch_ebay_price(card_obj) {
  console.log("fetch_ebay_price()")
  console.log(card_obj.title)
  ebay_secret_Auth = await LS.getItem("ebay_auth_token")
  return new Promise((res, rej) => {
    let description = card_obj.description.match(/.*(?= \-)/)[0]
    let title = card_obj.title.includes(" [") ? card_obj.title.match(/.*(?= \[)/)[0] : card_obj.title
    let ebay_searh_keywords = title + " " + description
    var ebay_API_Search_Item_Price = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${ebay_searh_keywords}&limit=3&filter=buyingOptions%3A%7BFIXED_PRICE%7D`;
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
        if (json.total == 0) {//if no items are found on EBAY 
          card_obj.items_found_on_ebay = false
          res(card_obj)
        }
        else {
          card_obj.items_found_on_ebay = true
          let itemSummaries = json.itemSummaries
          let prices = []
          for (let i = 0; i < itemSummaries.length; i++) {
            prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
          }
          small = prices[0]
          for (let i = 1; i < prices.length; i++){
            if (prices[i] < small) {
              small = prices[i]
            }
          }
          console.log(`The average price for ${ebay_searh_keywords} is: ${small}.`);
          card_obj.ebay_Price = (small.toFixed(2) * 0.925) - (small.toFixed(2)*0.178) - 1.20
          res(card_obj);
        }
      }
      else {//
        if (this.readyState == 4 && this.status != 200) {
        console.log("Error API Token Expired")
        chrome.runtime.sendMessage({message: "call_API_GetToken"})
        }
      }
    }
  })
}

// function get_new_API_Token() {
//   var ebay_Login = new XMLHttpRequest();
//   ebay_Login.open('POST', ebay_API_token_login);
//   ebay_Login.setRequestHeader('Content-type','application/x-www-form-urlencoded');
//   ebay_Login.setRequestHeader('Authorization','Basic ' + app_credentials);
//   params = {
//     "grant_type": "client_credentials",
//     "scope": "https://api.ebay.com/oauth/api_scope"
//     }
//   ebay_Login.send(JSON.stringify(params));
//   ebay_Login.onreadystatechange = function() {//Call a function when the state changes.
//     console.log(ebay_Login.response)}
// }

async function add_Ebay_Price_PL_in_Comc(card_obj) {
  return new Promise((res, rej) => {
    console.log(card_obj.PL)
    // const ebay_Price_Div = document.createElement("div");
    // ebay_Price_Div.innerText = "Ebay Price: " + card_obj.ebay_Price
    // ebay_Price_Div.className = "ebay-price"
    const ebay_PL = document.createElement("div");
    ebay_PL.innerText = "Profit/Loss: " + card_obj.PL.toFixed(2)
    ebay_PL.className = card_obj.PL > 0 ? "green-profit" : "red-loss"
    //all_Cards_Containers[card_obj.index].querySelector(".carddata").appendChild(ebay_Price_Div)
    all_Cards_Containers[card_obj.index].querySelector(".carddata").appendChild(ebay_PL)
    res()
  })
}

async function add_not_found_on_ebay(card_obj) {
  return new Promise((res, rej) => {
    const not_found = document.createElement("div");
    not_found.innerText = "Not Found On Ebay"
    not_found.className = "Not-Found-On-Ebay"
    all_Cards_Containers[card_obj.index].querySelector(".carddata").appendChild(not_found)
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
        let check = setInterval(async () => {
          if (await LS.getItem("added_to_cart?") == true) {
            await LS.setItem("added_to_cart?", false)
              clearInterval(check)
              res()
          }
          else {
            console.log("Waiting that card is added to cart...")
          }
        }, 1500);
      })
    }
    await wait_card_is_added_to_cart()
    res()
  })
}

async function add_to_cart() {
  try {
    document.querySelector(".addtocart").click()
    setTimeout(async () => {
      await LS.setItem("added_to_cart?", true).then((res) => window.close())
    }, 200);
    console.log("INSIDE CLICKED")
  }
  catch {
    console.log("INSIDE CATCH")
    setTimeout(async () => {
      await LS.setItem("added_to_cart?", true).then((res) => window.close())
    }, 200);
  }
}