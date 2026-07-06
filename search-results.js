// Search results page script
let currentSearchId = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentSearchId = params.get('id');
  
  if (currentSearchId) {
    loadAndDisplayResults(currentSearchId);
  }
});

function loadAndDisplayResults(searchId) {
  // Open IndexedDB
  const request = indexedDB.open('FlipLensDB', 1);
  
  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(['searches'], 'readonly');
    const store = transaction.objectStore('searches');
    const getRequest = store.get(parseInt(searchId));
    
    getRequest.onsuccess = () => {
      const search = getRequest.result;
      if (search) {
        displaySearch(search);
        if (search.status === 'pending') {
          // Trigger metadata scraping
          scrapeMetadata(search);
        }
      }
    };
  };
}

function displaySearch(search) {
  // Display source URL
  const sourceUrlEl = document.getElementById('source-url');
  sourceUrlEl.innerHTML = `Source: <a href="${escapeHtml(search.sourceUrl)}" target="_blank">${getDomain(search.sourceUrl)}</a>`;
  
  // Display original screenshot
  if (search.imageData) {
    document.getElementById('screenshot-section').style.display = 'block';
    document.getElementById('original-screenshot').src = search.imageData;
  }
  
  // Display results
  displayResults(search.results || []);
}

function displayResults(results) {
  const container = document.getElementById('results-container');
  
  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found yet. Google Lens is still searching...</p>
      </div>
    `;
    return;
  }
  
  // Group by source
  const bySource = {};
  results.forEach(result => {
    const source = result.source || 'Other';
    if (!bySource[source]) bySource[source] = [];
    bySource[source].push(result);
  });
  
  let html = '';
  Object.entries(bySource).forEach(([source, sourceResults]) => {
    html += `
      <div class="results-section">
        <h2>${formatSourceName(source)}</h2>
        <div class="results-grid">
          ${sourceResults.map(result => `
            <div class="result-card">
              ${result.thumbnail_url ? `<img src="${escapeHtml(result.thumbnail_url)}" class="result-image" alt="${escapeHtml(result.title)}">` : ''}
              <div class="result-content">
                <div class="result-title">${escapeHtml(result.title)}</div>
                ${result.price_low && result.price_high 
                  ? `<div class="result-price">$${result.price_low} - $${result.price_high}</div>` 
                  : ''}
                <div class="result-source">${formatSourceName(source)}</div>
                <a href="${escapeHtml(result.result_url)}" target="_blank" class="result-link">View Item →</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function scrapeMetadata(search) {
  // This would be called to fetch and parse Google Lens results
  // For MVP, we'll simulate with placeholder logic
  console.log('Scraping metadata for search:', search.id);
  
  // In production, this would:
  // 1. Send image to Google Lens API
  // 2. Parse returned HTML for results
  // 3. Extract title, price, thumbnail for each result
  // 4. Store in IndexedDB
  // 5. Update UI
}

function formatSourceName(source) {
  const names = {
    'ebay': '🛍️ eBay',
    'google-images': '🔍 Google Images',
    'shopping': '💳 Google Shopping',
    'other': '🔗 Other Sources'
  };
  return names[source] || source;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
