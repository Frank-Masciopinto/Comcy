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

//Test If Browsing a Collection - Then Collect all cards info
if (document.getElementById("cardexplorer")) {
  get_All_Cards_Info()
}


function get_All_Cards_Info() {
  console.log("get_All_Cards_Info()")
  //Get All Cards
  let all_Cards = document.querySelectorAll(".cardInfoWrapper")
  //Collecting All Cards Info and adding it to Array
  for (let i = 0; i < all_Cards.length; i++) {
    let card_Info = {}
    card_Info.index = i
    card_Info.title = all_Cards[i].querySelector(".title").innerText
    card_Info.description = all_Cards[i].querySelector(".description").innerText
    card_Info.list_Price = all_Cards[i].querySelector(".listprice").querySelector("a").innerText
    all_Cards_Array.push(card_Info)
  }
}

function add_to_cart(card)