//Run
const userGiftCardsChromeStorageKey = "userGiftCards";
// const userGiftCardData = {}

const l = function (message) {
  console.log('Log:', message);
}

const createDivElement = function () {
  return document.createElement("div");
}

const getObjectFromChromeSessionStorage = async function (key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([key]).then((result) => {

        l("Chrome storage data: " + JSON.stringify(result))

        resolve(result[key]);
        l("Retreived value: " + result[key] + " for key: " + key + " from chrome storage");
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const saveObjectInChromeSessionStorage = async function (key, value) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [key]: JSON.stringify(value) }).then(() => {
        l("Setting following value to chrome storage: " + JSON.stringify(value) +
          " for key: " + key);
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const removeObjectFromLocalStorage = async function (keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const refreshIndexes = async function() {
  l("Refreshing indexes");
  let index = 0;
  let currentUserGiftCards = await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey);
  if (currentUserGiftCards) {
    let currentUserGiftCardsJson = JSON.parse(currentUserGiftCards);
    currentUserGiftCardsJson.forEach((element) => {
      element.Index = index;
      index += 1;
    });
    await saveObjectInChromeSessionStorage(userGiftCardsChromeStorageKey, currentUserGiftCardsJson);
  }
  await showStoredCards();
  setBehaviors();
}

const loadSampleData = async function () {
  let userGiftCards = {};
  await fetch('../data/sample_card_data.json')
    .then(response => response.text())
    .then(data => {
      l("Reading card data from local file.");
      userGiftCards = JSON.parse(data).Cards;
    });
  await saveObjectInChromeSessionStorage(userGiftCardsChromeStorageKey, userGiftCards);
}

window.onload = onWindowLoad;

async function onWindowLoad() {
  // await loadSampleData();
  // await removeObjectFromLocalStorage(userGiftCardsChromeStorageKey);
  await refreshIndexes();
}

async function showStoredCards() {
  l("Loading saved data on home tab");
  let currentUserGiftCards = await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey);
  if (currentUserGiftCards) {
    let currentUserGiftCardsJson = JSON.parse(currentUserGiftCards);
    let userGiftCardsNode = document.getElementById("currentGiftCards");
    userGiftCardsNode.innerHTML = "";
    currentUserGiftCardsJson.forEach((element) => {
      userGiftCardsNode.appendChild(
        getAccordionItemWithCardInfo(element));
    });
  }
}

//Create accordion item html node.
function getAccordionItemWithCardInfo(cardInfo) {

  let indexStr = cardInfo.Index.toString();
  let headerId = 'heading' + indexStr;
  let collapseDivId = 'collapse' + indexStr;

  let accordionItem = createDivElement();
  accordionItem.className = "accordion-item";

  let accordionHeader = document.createElement("h2");
  {
    accordionHeader.classList.add("accordion-header", "d-flex");
    accordionHeader.id = headerId;

    let accordionHeaderCollapseButton = document.createElement("button");
    accordionHeaderCollapseButton.classList.add("accordion-button", "collapsed");
    accordionHeaderCollapseButton.setAttribute("type", "button");
    accordionHeaderCollapseButton.setAttribute("data-bs-toggle", "collapse");
    accordionHeaderCollapseButton.setAttribute("data-bs-target", "#" + collapseDivId);
    accordionHeaderCollapseButton.setAttribute("aria-expanded", "true");
    accordionHeaderCollapseButton.setAttribute("aria-controls", collapseDivId);
    accordionHeaderCollapseButton.innerText = cardInfo.Name;
    accordionHeader.appendChild(accordionHeaderCollapseButton);

    let accordionHeaderEditButton = document.createElement("button");
    accordionHeaderEditButton.id = "EditButton_" + indexStr;
    {
      let accordionEditButtonIcon = document.createElement("i");
      accordionEditButtonIcon.id = "EditButtonIcon_" + indexStr;
      accordionEditButtonIcon.classList.add("fa-solid", "fa-pen");
      accordionHeaderEditButton.appendChild(accordionEditButtonIcon);
    }
    accordionHeader.appendChild(accordionHeaderEditButton);

    let accordionHeaderDeleteButton = document.createElement("button");
    accordionHeaderDeleteButton.id = "DeleteButton_" + indexStr;
    {
      let accordionDeleteButtonIcon = document.createElement("i");
      accordionDeleteButtonIcon.id = "DeleteButtonIcon_" + indexStr;
      accordionDeleteButtonIcon.classList.add("fa-solid", "fa-trash");
      accordionHeaderDeleteButton.appendChild(accordionDeleteButtonIcon);
    }
    accordionHeader.appendChild(accordionHeaderDeleteButton);
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
    accordionCollapse.appendChild(accordionBody);
  }
  accordionItem.appendChild(accordionCollapse);

  return accordionItem;
}

//Create accordion item body HTML node.
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

function setBehaviors() {
  document.getElementById("addCardForm").addEventListener("submit", saveNewCardInfoToStorage);
  document.getElementById("myCardsTab").addEventListener("click", refreshIndexes);

  //get ALL elements whose ID starts with `DeleteButton_`
  document.querySelectorAll(`[id^="DeleteButton_"]`).forEach((node) => node.addEventListener("click", deleteGiftCard));
  document.querySelectorAll(`[id^="fa-trash"]`).forEach((node) => node.addEventListener("click", deleteGiftCard));
}

async function saveNewCardInfoToStorage(e) {
  e.preventDefault();
  let formData = new FormData(e.target);

  let inputData = await extractInputDataFromAddNewCardForm(formData);

  l("User entered: " + JSON.stringify(inputData));

  let currentUserGiftCards = await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey);
  let currentUserGiftCardsJson = [];
  if (currentUserGiftCards) {
    currentUserGiftCardsJson = JSON.parse(currentUserGiftCards);
  }

  l("Before adding new card: " + JSON.stringify(currentUserGiftCardsJson));
  currentUserGiftCardsJson.push(inputData);

  await saveObjectInChromeSessionStorage(userGiftCardsChromeStorageKey, currentUserGiftCardsJson);
  l("After adding new card: " + JSON.stringify(currentUserGiftCardsJson));

  l("Clearing Add Card Form and adding new card to the home tab");
  e.target.reset();
  showCardSavedConfirmation(inputData);
  await refreshIndexes();
}

//Exctract data from add New Card form into an object.
async function extractInputDataFromAddNewCardForm(formData) {
  let currentUserGiftCards = await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey);

  let newCardIndex = 0;
  if (currentUserGiftCards) {
    let currentUserGiftCardsJson = JSON.parse(currentUserGiftCards);
    newCardIndex = currentUserGiftCardsJson.length;
  }

  l("Formdata: " + JSON.stringify(formData));

  let inputData = {};
  inputData["Index"] = newCardIndex;
  inputData["Name"] = formData.get("companyNameInput").trim();
  inputData["Card_Number"] = formData.get("cardNumberInput").trim();
  inputData["PIN"] = formData.get("pinInput").trim();
  inputData["Redeem_Site"] = formData.get("redeemSiteInput").trim();
  return inputData;
}

function showCardSavedConfirmation(inputData) {
  alert("Your new Gift Card: '" + inputData.Name + "' has been saved.");
}

async function deleteGiftCard(e) {
  e.preventDefault();

  let deleteBtnId = e.target.id;
  let giftCardIndexToDelete = parseInt(deleteBtnId.toString().split("_")[1]);

  l("Trying to delete accordion with index: " + giftCardIndexToDelete);

  let currentUserGiftCards = await getObjectFromChromeSessionStorage(userGiftCardsChromeStorageKey);
  let currentUserGiftCardsJson = JSON.parse(currentUserGiftCards);

  l("Before removing card with Index- " + giftCardIndexToDelete + " :  " + JSON.stringify(currentUserGiftCardsJson));
  currentUserGiftCardsJson = currentUserGiftCardsJson.filter((card) => card.Index !== giftCardIndexToDelete);

  await saveObjectInChromeSessionStorage(userGiftCardsChromeStorageKey, currentUserGiftCardsJson);
  l("After removing card with Index- " + giftCardIndexToDelete + " :  " + JSON.stringify(currentUserGiftCardsJson));

  await refreshIndexes();
}
