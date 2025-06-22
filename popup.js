function getFaviconUrl(domain) {
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  }
  
function renderProducts(products) {
  const inStockOnly = document.getElementById("inStockOnly").checked;
  const container = document.getElementById("productList");
  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = "<p class='empty'>No products found.</p>";
    return;
  }

  const filtered = products
    .filter(p => !inStockOnly || p.stock.toLowerCase() === "in stock")
    .sort((a, b) => a.price - b.price);

      filtered.forEach(p => {
    const el = document.createElement("div");
    el.className = "product";
    el.innerHTML = `
      <div class="card">
        <div class="product-title"><img src="${getFaviconUrl(p.shop)}" width="16" height="16"><strong>${p.shop}</strong></div>
        <div class="meta">
          <span>&#x1F4B0; <strong>${p.price.toLocaleString()} LKR</strong></span><br>
          <span>&#x1F9C3; ${p.name}</span><br>
          <span>&#x1F4E6; ${p.stock}</span><br>
          <a href="${p.link}" target="_blank">&#x1F517; Open Product</a>
        </div>
      </div>
    `;
    container.appendChild(el);
  });

  document.getElementById("exportBtn").onclick = () => exportProducts(filtered);
}
  
  function getProductsFromPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "get_products" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching products:", chrome.runtime.lastError);
          return;
        }
        renderProducts(response.data);
      });
    });
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

  
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("inStockOnly").addEventListener("change", getProductsFromPage);
    getProductsFromPage();
  });