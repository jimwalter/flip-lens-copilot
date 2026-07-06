// Storage utility for IndexedDB
class SearchStorage {
  constructor() {
    this.dbName = 'FlipLensDB';
    this.storeName = 'searches';
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('sourceUrl', 'sourceUrl', { unique: false });
        }
      };
    });
  }

  async addSearch(searchData) {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...searchData,
        timestamp: Date.now(),
        id: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSearches() {
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => {
        resolve(request.result.reverse()); // Most recent first
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSearch(id) {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const storage = new SearchStorage();

// Initialize storage on service worker startup
chrome.runtime.onInstalled.addListener(() => {
  storage.init();
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {
    action: "activateSelection"
  }).catch((error) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, {
        action: "activateSelection"
      });
    });
  });
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureRegion") {
    captureAndStore(request.region, request.sourceUrl, sendResponse);
    return true;
  }
  
  if (request.action === "getSearchHistory") {
    storage.init().then(() => {
      storage.getAllSearches().then(searches => {
        sendResponse({ searches });
      });
    });
    return true;
  }
});

async function captureAndStore(region, sourceUrl, sendResponse) {
  try {
    // Use Chrome's screenshot API
    const canvas = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Crop the canvas to the selected region
    const croppedDataUrl = cropImage(canvas, region);
    
    // Store in local DB
    await storage.init();
    const searchData = {
      imageData: croppedDataUrl,
      sourceUrl: sourceUrl || 'Unknown',
      results: [],
      status: 'pending'
    };
    
    const searchId = await storage.addSearch(searchData);
    
    // Open results tab
    chrome.tabs.create({
      url: chrome.runtime.getURL("search-results.html?id=" + searchId),
      active: false
    });
    
    sendResponse({ status: "captured", searchId });
  } catch (error) {
    console.error("Capture failed:", error);
    sendResponse({ status: "error", error: error.message });
  }
}

function cropImage(dataUrl, region) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.onload = () => {
    canvas.width = region.width;
    canvas.height = region.height;
    ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
  };
  img.src = dataUrl;
  
  return canvas.toDataURL('image/png');
}
