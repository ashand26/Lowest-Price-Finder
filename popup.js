let cachedResults = [];

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
}

function renderProducts(products) {
  const inStockOnly = document.getElementById("inStockOnly").checked;
  const container = document.getElementById("productList");
  container.innerHTML = "";

  const filtered = products
    .filter(p => !inStockOnly || p.stock.toLowerCase() === "in stock")
    .sort((a, b) => a.price - b.price);

  if (!filtered.length) {
    container.innerHTML = "<p class='empty'>No products found.</p>";
    return;
  }

  filtered.forEach(p => {
    const el = document.createElement("div");
    el.className = "product";
    el.innerHTML = `
      <div class="card">
        <div class="product-title">${p.name}</div>
        <div class="meta">
          <span>&#x1F4B0; <strong>${p.price.toLocaleString()} LKR</strong></span><br>
          <span>&#x1F3EA; <img src="${getFaviconUrl(p.shop)}" width="16" height="16"> ${p.shop}</span><br>
          <span>&#x1F4E6; ${p.stock}</span><br>
          <a href="${p.link}" target="_blank">&#x1F517; Open Product</a>
        </div>
      </div>
    `;
    container.appendChild(el);
  });

  document.getElementById("exportBtn").onclick = () => exportProducts(filtered);
}

function exportProducts(products) {
  const headers = ["Product Name", "Price (LKR)", "Shop", "Stock", "Link"];
  const csvRows = [headers.join(",")];

  products.forEach(p => {
    const row = [
      `"${p.name}"`,
      p.price,
      p.shop,
      p.stock,
      p.link
    ];
    csvRows.push(row.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url: url, filename: "products.csv" });
}

async function extractFromCurrentPage(tabId, searchQuery) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    args: [searchQuery],
    func: (searchQuery) => {
      const priceRegex = /LKR\s?([\d,]+(?:\.\d{2})?)/i;
      const stockRegex = /(In stock|Out of stock)/i;
      const blocks = document.querySelectorAll('div.g, div.MjjYud');
      const results = [];

      blocks.forEach(block => {
        const text = block.innerText.toLowerCase();
        if (!text.includes(searchQuery)) return;

        const priceMatch = text.match(priceRegex);
        const stockMatch = text.match(stockRegex);
        const link = block.querySelector('a')?.href;
        const title = block.querySelector('h3')?.innerText;
        const domain = link ? new URL(link).hostname.replace('www.', '') : 'Unknown';

        if (priceMatch && title && link) {
          results.push({
            shop: domain,
            name: title,
            price: parseFloat(priceMatch[1].replace(/,/g, '')),
            stock: stockMatch ? stockMatch[1] : 'Unknown',
            link: link
          });
        }
      });

      return results;
    }
  });

  return result[0].result;
}

async function goToNextPage(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const nextBtn = document.querySelector("#pnnext");
      if (nextBtn) nextBtn.click();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2500));
}

async function collectMultiPageResults(maxPages = 3) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab.id;

  const urlParams = new URLSearchParams(new URL(tab.url).search);
  const searchQuery = urlParams.get('q')?.toLowerCase() || '';

  let results = [];

  for (let i = 0; i < maxPages; i++) {
    const pageData = await extractFromCurrentPage(tabId, searchQuery);
    results.push(...pageData);

    const hasNext = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!document.querySelector('#pnnext')
    });

    if (!hasNext[0].result) break;

    await goToNextPage(tabId);
  }

  cachedResults = results;
  renderProducts(cachedResults);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("inStockOnly").addEventListener("change", () => {
    renderProducts(cachedResults);
  });

  collectMultiPageResults(3);
});
