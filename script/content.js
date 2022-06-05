console.log("COMCY --- Content.js is injected!")

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  console.log(request)
  if(request.message == "open_side_panel"){
      console.log(request.message);
      toggle();
      sendResponse({mess: "DONE"})
  }
})

let all_Cards_Array = []

//Test If Browsing a Collection - Then Collect all cards info & look for Profits on Ebay
if (document.getElementById("cardexplorer")) {
  get_All_Cards_Info()
}
else if (window.name == "add_to_cart") {
  //Add to cart then close window
  add_to_cart()
}

function notify(title, description) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'Images/128.png',
    title: title,
    message: description,
    priority: 1
  })
}

async function get_All_Cards_Info() {
  console.log("get_All_Cards_Info()")
  notify("Comcy - Started Comparing Prices on Ebay", 'Hold on, Im looking for Profits!')
  //Get All Cards
  let all_Cards = document.querySelectorAll(".cardInfoWrapper")
  //Collecting All Cards Info, fetch Ebay price, display it, the if profit margin match or above user chosen
  for (let i = 0; i < all_Cards.length; i++) {
    let card_Info = {}
    card_Info.index = i
    card_Info.title = all_Cards[i].querySelector(".title").innerText
    card_Info.description = all_Cards[i].querySelector(".description").innerText
    card_Info.list_Price = all_Cards[i].querySelector(".listprice").querySelector("a").innerText
    card_Info.href = all_Cards[i].querySelector("a").href
    all_Cards_Array.push(card_Info)
    card_Info = await fetch_ebay_price(card_Info)
    card_Info.PL = card_Info.ebay_Price - card_Info.list_Price
    await add_Ebay_Price_PL_in_Comc(card_Info)
    //If Ebay Price is above the margin value set by user -> open product page and add to cart
    if (card_Info.PL >= await LS.getItem("margin_Value_State")) {
      notify("Comcy - Adding to Cart Profitable Card", `${card_Info.description}`)
      await open_card_page_wait_added_to_cart()
    }
  }
}

async function fetch_ebay_price(card_obj) {
  return new Promise((res, rej) => {
    res()
  })
}

async function add_Ebay_Price_PL_in_Comc(card_obj) {
  return new Promise((res, rej) => {
    const ebay_Price_Div = document.createElement("div");
    ebay_Price_Div.innerText = "Ebay Price: " + card_obj.ebay_Price
    const ebay_PL = document.createElement("div");
    ebay_PL.innerText = "Profit/Loss: " + card_obj.PL
    all_Cards_Array[card_obj.index].querySelector("carddata").appendChild(ebay_Price_Div)
    all_Cards_Array[card_obj.index].querySelector("carddata").appendChild(ebay_PL)
    res()
  })
}

async function open_card_page_wait_added_to_cart(card_obj) {
  return new Promise((res, rej) => {
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