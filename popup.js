// Popup script for sidebar
document.addEventListener('DOMContentLoaded', () => {
  loadSearchHistory();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('new-scan-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "activateSelection"
      }).catch((error) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content.js"]
        }).then(() => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "activateSelection"
          });
        });
      });
    });
  });
}

function loadSearchHistory() {
  chrome.runtime.sendMessage({ action: "getSearchHistory" }, (response) => {
    if (!response || !response.searches) return;
    
    const searches = response.searches;
    const content = document.getElementById('content');
    
    // Update scan count
    document.getElementById('scan-count').textContent = Math.min(searches.length, 10);
    
    if (searches.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">No searches yet.<br>Click the extension icon to start scanning!</div>
        </div>
      `;
      return;
    }
    
    // Clear and populate with searches
    content.innerHTML = searches.map((search, idx) => {
      const hasResults = search.results && search.results.length > 0;
      const mainResult = hasResults ? search.results[0] : null;
      const title = mainResult?.title || 'Search #' + (searches.length - idx);
      const priceRange = mainResult?.price_low && mainResult?.price_high 
        ? `$${mainResult.price_low} - $${mainResult.price_high}` 
        : 'N/A';
      const thumbnail = mainResult?.thumbnail_url || search.imageData;
      const sourceUrl = search.sourceUrl || 'Unknown';
      const timestamp = new Date(search.timestamp).toLocaleDateString();
      
      return `
        <div class="search-item">
          <img src="${thumbnail}" class="search-thumbnail" alt="${escapeHtml(title)}">
          <div class="search-meta">
            <div class="search-title">${escapeHtml(title)}</div>
            <div class="search-price">${priceRange}</div>
            <div class="search-source">
              <a href="${escapeHtml(sourceUrl)}" target="_blank" title="${escapeHtml(sourceUrl)}">
                ${getDomain(sourceUrl)}
              </a>
            </div>
            <div class="search-time">${timestamp}</div>
          </div>
          <div class="search-actions">
            <button class="btn-small btn-view" onclick="viewResults(${search.id})">View Results</button>
            <button class="btn-small btn-delete" onclick="deleteSearch(${search.id})">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  });
}

function viewResults(searchId) {
  const url = chrome.runtime.getURL(`search-results.html?id=${searchId}`);
  chrome.tabs.create({ url: url });
}

function deleteSearch(searchId) {
  if (confirm('Delete this search?')) {
    // For now, just reload. Later will implement actual delete via DB
    loadSearchHistory();
  }
}

function getDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Refresh search history when popup opens
window.addEventListener('focus', () => {
  loadSearchHistory();
});
