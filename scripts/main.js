//Run
const userGiftCardsChromeStorageKey = "userGiftCards";
const userGiftCardData = {}

const l = function(message) {
  console.log('Log:', message);
}

const getObjectFromChromeSessionStorage = async function(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.session.get([key]).then((result) => {
        resolve(result[key]);
        l("Retreived value: " + result[key] + " for key: " + key + " from chrome storage");
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const saveObjectInChromeSessionStorage = async function(key, value) {
  return new Promise((resolve, reject) => {
    try {
      //The object name used as key in the set function should match the value of "userGiftCardsChromeStorageKey" declared at the top      
      chrome.storage.session.set({[key]: JSON.stringify(value)}).then(() => {
        l("Setting following value to chrome storage: " + JSON.stringify(value) +
          " for key: " + key);
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const loadSampleData = async function() {
  let userGiftCards = {};
  await fetch('../data/sample_card_data.json')
  . then(response => response.text())
  . then(data => {
    l("Reading card data from local file.");  
    userGiftCards = JSON.parse(data).Cards;
  });
  await saveObjectInChromeSessionStorage(userGiftCardsChromeStorageKey, userGiftCards);
}

window.onload = onWindowLoad;

async function onWindowLoad() {
  await loadSampleData();
  await showStoredCards();
  setAddCardOnSubmitBehaviors();
}

async function showStoredCards() {
    let currentUserGiftCards = JSON.parse(await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey));
    currentUserGiftCards.forEach((element, index) => {
      document.getElementById("currentGiftCards").appendChild(
        getAccordionItemWithCardInfo(element, index));
    });
}

function getAccordionItemWithCardInfo(cardInfo, index) {

  let indexStr = JSON.stringify(index);
  let headerId = 'heading' + indexStr;
  let collapseDivId = 'collapse' + indexStr;

  let accordionItem = createDivElement();
  accordionItem.className = "accordion-item";

  let accordionHeader = document.createElement("h2");
  {
    accordionHeader.className = "accordion-header";
    accordionHeader.id = headerId;

    let accordionHeaderButton = document.createElement("button");
    {
      accordionHeaderButton.classList.add("accordion-button", "collapsed");
      accordionHeaderButton.setAttribute("type", "button");
      accordionHeaderButton.setAttribute("data-bs-toggle", "collapse"); 
      accordionHeaderButton.setAttribute("data-bs-target", "#" + collapseDivId);
      accordionHeaderButton.setAttribute("aria-expanded", "true");
      accordionHeaderButton.setAttribute("aria-controls", collapseDivId);
      accordionHeaderButton.innerText = cardInfo.Name;
    }
    accordionHeader.appendChild(accordionHeaderButton);
  }
  accordionItem.appendChild(accordionHeader);

  let accordionCollapse = createDivElement();
  {
    accordionCollapse.id = collapseDivId;
    accordionCollapse.classList.add("accordion-collapse", "collapse");
    accordionCollapse.setAttribute("aria-labelledby", headerId);
    accordionCollapse.setAttribute("data-bs-parent", "#currentGiftCards");

    let accordionBody = createDivElement();
    {
      accordionBody.className = "accordion-body";
      accordionBody.appendChild(getGiftCardDetail(cardInfo));
    }
    l("AccordionBody: " + accordionBody);
    accordionCollapse.appendChild(accordionBody);
  }
  accordionItem.appendChild(accordionCollapse);
  
  return accordionItem;
}

function createDivElement() {
  return document.createElement("div");
}

function getGiftCardDetail(cardInfo) {
  let cardDetail = createDivElement();
  let cardNumber = document.createElement("p");
  {
    cardNumber.innerText = "Gift Card Number: " + cardInfo.Card_Number;
  }
  cardDetail.appendChild(cardNumber);

  let pin = document.createElement("p");
  {
    pin.innerText = "PIN: " + cardInfo.PIN;
  }
  cardDetail.appendChild(pin);

  let redeemWebsite = document.createElement("p");
  {
    redeemWebsite.innerText = "Redeem: ";
    
    let redeemWebsiteLink = document.createElement("a");
    {
      redeemWebsiteLink.href = cardInfo.Redeem_Site;
      redeemWebsiteLink.innerText = cardInfo.Redeem_Site;
    }
    redeemWebsite.appendChild(redeemWebsiteLink);
  }
  cardDetail.appendChild(redeemWebsite);

  return cardDetail;
}

function setAddCardOnSubmitBehaviors() {
  document.getElementById("addCardForm").addEventListener("submit", saveNewCardInfoToStorage);
}

async function saveNewCardInfoToStorage(e) {
  e.preventDefault();
  let formData = new FormData(e.target);

  let inputData = {};
  inputData["Name"] = formData.get("companyNameInput").trim();
  inputData["Card_Number"] = formData.get("cardNumberInput").trim();
  inputData["PIN"] = formData.get("pinInput").trim();
  inputData["Redeem_Site"] = formData.get("redeemSiteInput").trim();

  l("User entered: " + JSON.stringify(inputData));

  let currentUserGiftCards = JSON.parse(await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey));

  l("Before adding new card: " + JSON.stringify(currentUserGiftCards));
  currentUserGiftCards.push(inputData);

  l("After adding new card: " + JSON.stringify(currentUserGiftCards));
  await saveObjectInChromeSessionStorage(userGiftCardsChromeStorageKey, currentUserGiftCards);
}
