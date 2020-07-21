function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    key: document.querySelector("#key").value,
    deck: document.querySelector("#deck").value
  });
}

function restoreOptions() {

  function setCurrentChoice(result) {
    document.querySelector("#key").value = result.key || "";
    document.querySelector("#deck").value = result.deck || "";
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get();
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);