const browser = require("webextension-polyfill");
function getStorageData(key) {
  return new Promise((resolve, reject) => {
    browser.storage.local.get(key).then((result) => {
      if (browser.runtime.lastError) {
        reject(Error(browser.runtime.lastError.message));
      }
      resolve(result);
    });
  });
}

const setStorageData = (data) => {
  return new Promise((resolve, reject) => {
    browser.storage.local.set(data).then(() => {
      if (browser.runtime.lastError) {
        reject(Error(browser.runtime.lastError.message));
      }
      resolve();
    });
  });
};

module.exports = {
  getStorageData,
  setStorageData,
};