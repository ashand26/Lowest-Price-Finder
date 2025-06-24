function extractProductsFromGoogleSearch() {
    const resultBlocks = document.querySelectorAll('div.g, div.MjjYud');
    const priceRegex = /LKR\s?([\d,]+(?:\.\d{2})?)/i;
    const stockRegex = /(In stock|Out of stock)/i;
  
    let products = [];
  
    resultBlocks.forEach(block => {
      const text = block.innerText;
      const priceMatch = text.match(priceRegex);
      const stockMatch = text.match(stockRegex);
      const link = block.querySelector('a')?.href;
      const title = block.querySelector('h3')?.innerText;
      const domain = link ? new URL(link).hostname.replace('www.', '') : 'Unknown';
  
      if (priceMatch && title && link) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        const stock = stockMatch ? stockMatch[1] : 'Unknown';
        products.push({
          shop: domain,
          name: title,
          price: price,
          stock: stock,
          link: link
        });
      }
    });
  
    return products;
  }