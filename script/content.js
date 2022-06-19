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
let FILTER_buy_now = ",fb"
let FILTER_highest_percent_off =",sp"
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

let daily_extracted_pages = {
  DATES: [],
  PAGES: []
}

//Test If Browsing a Collection - Then Collect all cards info & look for Profits on Ebay
// if (document.getElementById("cardexplorer")) {
//   notify("Comcy - Started Comparing Prices on Ebay", 'Hold on, Im looking for Profits!')
//   get_All_Cards_Info()
// }
if (window.name == "add_to_cart") {
  console.log("Adding to Cart...")
  //Add to cart then close window
  add_to_cart()
}
else if (window.name == "get_token") {
  update_token()
}
else if (window.name == "start_automation") {
  start_automation()
}
else if (window.name == "search_for_profitable_cards") {
    start_category_automation()
}

async function start_category_automation() {
  if (!document.querySelector(".noResults")) {//if there is results start automation
    await automation_process()
    document.querySelector(".pgnext").click()//click next page
  }
  else {
    await LS.setItem("search_ended", true)//of no results, go to next category
    window.close()
  }
}

function notify(title, description) {
  chrome.runtime.sendMessage({message: "create_notification", title: title, description: description})
}

async function start_automation() {
  await remove_pages_extracted_24hrs()
  daily_extracted_pages = await LS.getItem("Pages_scraped_daily_DB")

  for (let i=0; i<CATEGORIES_LINKS.SPORT.length; i++) {
    daily_extracted_pages.PAGES.push(CATEGORIES_LINKS.SPORT[i])
    daily_extracted_pages.DATES.push(new Date)
    await LS.setItem("Pages_scraped_daily_DB", daily_extracted_pages)
    window.open(CATEGORIES_LINKS.SPORT[i] + FILTER_buy_now + FILTER_highest_percent_off, "search_for_profitable_cards")
    let category = CATEGORIES_LINKS.SPORT[i].match(/(?<=https:\/\/www\.comc\.com\/Cards\/).*/)[0]
    notify("Cards Arbitrage - Hold on, I'm searching for Profits", `*** Category ${category} ***`)
    await LS.setItem("search_ended", false)
    await wait_for_search_ends()
  }
}
function check_NaN(val) {
  if (parseInt(val) != parseInt(val)) {
      return 0;
  }
  return parseInt(val);
}
async function remove_pages_extracted_24hrs() {
  console.log("remove_pages_extracted_24hrs()")
  let oneDay = 86400000;
  let today_Date = new Date();
  let filtered_pages;
  return new Promise(async (res, rej) => {
    daily_extracted_pages = await LS.getItem("Pages_scraped_daily_DB")
    filtered_pages = daily_extracted_pages
    if (daily_extracted_pages.PAGES.length == 0) {
      res()
    }
    for (let i = 0; i < daily_extracted_pages.PAGES.length; i++) {
      let date_of_comparison = new Date(daily_extracted_pages.DATES[i]);
      console.log("Checking if 1 day passed");
      console.log(filtered_pages.PAGES[i])
      let days_Passed_Since_last_extraction = check_NaN(Math.round(Math.abs((today_Date - date_of_comparison) / oneDay)));
      console.log(days_Passed_Since_last_extraction);
      //If 1 days passed since last check, remove category from state
      if (days_Passed_Since_last_extraction > 0) {
        console.log("One day have passed")
        filtered_pages.PAGES = filtered_pages.PAGES.filter(e => e !== filtered_pages.PAGES[i])
        filtered_pages.DATES = filtered_pages.DATES.filter(e => e !== filtered_pages.DATES[i])
      }
      else {//if less than 24 hrs passed, remove that category from scraping sequence
        console.log("Less than 24hrs passed, removing category from scraping list")
        CATEGORIES_LINKS.SPORT = CATEGORIES_LINKS.SPORT.filter(e => e !== daily_extracted_pages.PAGES[i])
        CATEGORIES_LINKS.GAMING = CATEGORIES_LINKS.GAMING.filter(e => e !== daily_extracted_pages.PAGES[i])
        CATEGORIES_LINKS.TRADING = CATEGORIES_LINKS.TRADING.filter(e => e !== daily_extracted_pages.PAGES[i])
      }
    }
    await LS.setItem("Pages_scraped_daily_DB", filtered_pages)
    console.log("Removed 24hrs Pages, returning")
    res()
  })
}

async function wait_for_search_ends() {
  console.log("wait_for_search_ends")
  return new Promise((res, rej) => {
    let condition = setInterval(async () => {
      if (await LS.getItem("search_ended") == true) {
        clearInterval(condition)
        await LS.setItem("search_ended", false)
        res()
      }
      else {
        console.log("Search not ended yet...")
      }
    }, 4000);
  })
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
        notify("Cards Arbitrage - Adding to Cart Profitable Card", `$$$ ${card_Info.title} $$$`)
        await open_card_page_wait_added_to_cart(card_Info)
      }
    }
    else {
      add_not_found_on_ebay(card_Info)
    }
  }
}

async function automation_process() {
  return new Promise(async (res, rej) => {
    console.log("automation_process()")
    all_Cards_Containers = document.querySelectorAll(".cardInfoWrapper")
    let min_price = await LS.getItem("min_price")
    let max_price = await LS.getItem("max_price")
    //Collecting All Cards Info, fetch Ebay price, display it, the if profit margin match or above user chosen
    for (let i = 0; i < all_Cards_Containers.length; i++) {
      card_price = parseFloat(all_Cards_Containers[i].querySelector(".listprice").querySelector("a").innerText.replace("$", ""))
      if (card_price >= min_price && card_price <= max_price) { //if cards match buy price, compare it
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
            notify("Cards Arbitrage - Adding to Cart Profitable Card", `$$$ ${card_Info.title} $$$`)
            await open_card_page_wait_added_to_cart(card_Info)
          }
        }
        else {
          add_not_found_on_ebay(card_Info)
        }
      }
      else {//if does not match price target, skip
        add_not_price_target({index: i})
      }
      if (i == all_Cards_Containers.length -1) {
        console.log("All Cards Checked on this page.")
        res()
      }
      }
  })
}


function buildRegEx(str, keywords){
  try {
    return new RegExp("(?=.*?\\b" + 
      keywords
        .split(" ")
        .join(")(?=.*?\\b") +                     
      ").*", 
      "i"
    );
  }
  catch {
    return "false"
  }
}

function test(str, keywords, expected){
  console.log("Checking folowing keywords in Ebay REsult Title: ")
  console.log(keywords)
  try {
    var result = buildRegEx(str, keywords).test(str) === expected
    console.log(result ? "Passed" : "Failed");
    return result
  }
  catch {
    return false
  }
}

async function set_keywords(card_obj) {
  return new Promise((res, rej) => {
    let description = card_obj.description.includes(" [") ? card_obj.description.match(/.*(?= \[)/)[0] : card_obj.description
    let title = card_obj.title.includes(" [") ? card_obj.title.match(/.*(?= \[)/)[0] : card_obj.title
    title = title.includes(" (") ? title.match(/.*(?= \()/)[0] : title
    setTimeout(() => {
      console.log("Title Extracted: " + title)
      res(encodeURIComponent(title + " " +description))
    }, 100);
  })
}

async function search_ebay_by_image(image, card_obj) {
  console.log("search_ebay_by_image()")
  console.log(card_obj.title)
  ebay_secret_Auth = await LS.getItem("ebay_auth_token")
  return new Promise(async (res, rej) => {
    //let description = card_obj.description.match(/.*(?= \-)/)[0]
    let ebay_searh_keywords = await set_keywords(card_obj)
    let year = card_obj.description.match(/^\d{4}/)
    let card_no = card_obj.description.match(/#\w+\d+$/)
    let title = card_obj.title.includes(" [") ? card_obj.title.match(/.*(?= \[)/)[0] : card_obj.title
    console.log(ebay_searh_keywords)
    var ebay_API_Search_Item_Price = `https://api.ebay.com/buy/browse/v1/item_summary/search_by_image?limit=15&filter=buyingOptions%3A%7BFIXED_PRICE%7D`;
    var ebay_Request = new XMLHttpRequest();
    ebay_Request.open('GET', ebay_API_Search_Item_Price);
    ebay_Request.setRequestHeader('Accept','application/json');
    ebay_Request.setRequestHeader('Content-type','application/json');
    ebay_Request.setRequestHeader('Authorization','Bearer ' + ebay_secret_Auth);
    ebay_Request.send();
    ebay_Request.onreadystatechange = function() {//Call a function when the state changes.
      if (this.readyState == 4 && this.status == 200) {
        console.log(ebay_Request.response.href)
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
            console.log(title)
            console.log(itemSummaries[i].title)
            if (itemSummaries[i].title.includes(title)) {
              if (year) {
                if (itemSummaries[i].title.includes(year[0])) {
                  if (card_no) {
                    if (itemSummaries[i].title.includes(card_no[0])) {
                      console.log("Year & Card Number Found")
                      prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
                    }
                  }
                  else {
                    console.log("Only Year Found, skipping")
                    //prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
                  }
                }
              }
              else {
                console.log("nor Year not card no found on comc card, skipping")
                //prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
              }
            }
          }
          setTimeout(() => {
            if (prices.length != 0) {
              let small = prices[0]
              for (let i = 1; i < prices.length; i++){
                if (prices[i] < small) {
                  small = prices[i]
                }
              }
              console.log(`The cheapest price on Ebay for ${title} is: ${small}.`);
              card_obj.ebay_Price = (small.toFixed(2) * 0.925) - (small.toFixed(2)*0.178) - 1.20
              res(card_obj);
            }
            else {
              card_obj.items_found_on_ebay = false
              res(card_obj)
            }
          }, 100);
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

async function fetch_ebay_price(card_obj) {
  console.log("fetch_ebay_price()")
  console.log(card_obj.title)
  ebay_secret_Auth = await LS.getItem("ebay_auth_token")
  return new Promise(async (res, rej) => {
    //let description = card_obj.description.match(/.*(?= \-)/)[0]
    let ebay_searh_keywords = await set_keywords(card_obj)
    let year = card_obj.description.match(/^\d{4}/)
    let card_no = card_obj.description.match(/#\w+\-?\d+$/)
    let title = card_obj.title.includes(" [") ? card_obj.title.match(/.*(?= \[)/)[0] : card_obj.title
    console.log(ebay_searh_keywords)
    var ebay_API_Search_Item_Price = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${ebay_searh_keywords}&limit=15&sort=price`;
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
        let prices;
        if (json.total == 0) {//if no items are found on EBAY 
          card_obj.items_found_on_ebay = false
          res(card_obj)
        }
        else {
          card_obj.items_found_on_ebay = true
          let itemSummaries = json.itemSummaries
          prices = []
          for (let i = 0; i < itemSummaries.length; i++) {
            console.log(title)
            console.log(itemSummaries[i].title)
            if (test(itemSummaries[i].title, title + " " + year, true)) {
              console.log("Title Found")
              console.log(itemSummaries[i].price.value)
              prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
            }
                  
            else {
              console.log("No title, skipping")
              //prices.push(parseFloat(itemSummaries[i].price.value))//Adding every item price to array, for later average calculation
            }
            }
          }
          try {
            if (prices.length != 0) {
              let small = prices[0]
              for (let i = 1; i < prices.length; i++){
                if (prices[i] < small) {
                  small = prices[i]
                }
              }
              console.log(`The cheapest price on Ebay for ${title} is: ${small}.`);
              card_obj.ebay_Price = (small.toFixed(2) * 0.925) - (small.toFixed(2)*0.178) - 1.20
              res(card_obj);
            }
            else {
              card_obj.items_found_on_ebay = false
              res(card_obj)
            }
          }
          catch {
            card_obj.items_found_on_ebay = false
            res(card_obj)
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
async function add_not_price_target(card_obj) {
  return new Promise((res, rej) => {
    const not_found = document.createElement("div");
    not_found.innerText = "Not in price target"
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
