// Selection state
let isSelecting = false;
let startX, startY;
let selectionBox = null;
let overlay = null;

// Listen for message from background script to activate selection mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "activateSelection") {
    activateSelectionMode();
    sendResponse({ status: "selection activated" });
  }
});

function activateSelectionMode() {
  if (isSelecting) return;
  
  isSelecting = true;
  document.body.style.cursor = "crosshair";
  
  // Add overlay for visual feedback
  overlay = document.createElement("div");
  overlay.id = "flip-lens-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    z-index: 10000;
    cursor: crosshair;
  `;
  document.body.appendChild(overlay);
  
  document.addEventListener("mousedown", handleMouseDown, true);
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("mouseup", handleMouseUp, true);
  document.addEventListener("keydown", handleEscape, true);
}

function handleMouseDown(e) {
  if (!isSelecting) return;
  
  startX = e.clientX;
  startY = e.clientY;
  
  // Create selection box
  selectionBox = document.createElement("div");
  selectionBox.id = "flip-lens-selection-box";
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #4285F4;
    background: rgba(66, 133, 244, 0.1);
    z-index: 10001;
    pointer-events: none;
  `;
  document.body.appendChild(selectionBox);
  
  e.preventDefault();
}

function handleMouseMove(e) {
  if (!isSelecting || !selectionBox) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selectionBox.style.left = left + "px";
  selectionBox.style.top = top + "px";
  selectionBox.style.width = width + "px";
  selectionBox.style.height = height + "px";
  
  e.preventDefault();
}

function handleMouseUp(e) {
  if (!isSelecting) return;
  
  const width = Math.abs(e.clientX - startX);
  const height = Math.abs(e.clientY - startY);
  
  if (width < 10 || height < 10) {
    cancelSelection();
    return;
  }
  
  captureSelection(startX, startY, e.clientX, e.clientY);
  e.preventDefault();
}

function handleEscape(e) {
  if (e.key === "Escape" && isSelecting) {
    cancelSelection();
  }
}

function cancelSelection() {
  isSelecting = false;
  document.body.style.cursor = "auto";
  
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  
  document.removeEventListener("mousedown", handleMouseDown, true);
  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("mouseup", handleMouseUp, true);
  document.removeEventListener("keydown", handleEscape, true);
}

function captureSelection(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  
  // Use Chrome's native screenshot API
  chrome.runtime.sendMessage({
    action: "captureRegion",
    region: {
      x: left,
      y: top,
      width: width,
      height: height
    },
    sourceUrl: window.location.href
  }, response => {
    cancelSelection();
    if (response && response.status === "captured") {
      console.log("Screenshot captured and stored");
    }
  });
}
