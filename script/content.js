console.log("HUYP --- Content.js is running!")

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  console.log(request)
  if(request.message == "open_side_panel"){
      console.log(request.message);
      toggle();
      sendResponse({mess: "DONE"})
  }
  else if(request.message === "Close_IFrame"){
      iframe.style.width="0px";
      sendResponse({mess: "DONE"})
  }
})


var iframe = document.createElement('iframe'); 
iframe.style.height = "100%";
iframe.style.width = "0px";
iframe.style.position = "fixed";
iframe.classList.add("huyp-frame")
iframe.style.top = "0px";
iframe.style.right = "0px";
iframe.style.zIndex = "9000000000000000000";
iframe.style.border = "1px solid rgb(0, 122, 236)"; 
iframe.style.borderRadius = "50px";
iframe.src = chrome.runtime.getURL("html/slider-search.html")

function toggle(){
  document.body.appendChild(iframe);
  iframe.style.width="400px";

}