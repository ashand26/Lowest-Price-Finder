chrome.runtime.onInstalled.addListener(() => {
    console.log("Lowest Price Finder extension installed.");
  });
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "get_products") {
      const waitForContent = () => {
        const resultBlocks = document.querySelectorAll('div.g');
        if (resultBlocks.length > 0) {
          const results = extractProductsFromGoogleSearch();
          sendResponse({ data: results });
        } else {
          setTimeout(waitForContent, 300); // Retry after 300ms
        }
      };
      waitForContent();
      return true; // Indicates async response
    }
  });
  