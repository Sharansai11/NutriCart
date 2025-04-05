// server/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// Scraper endpoint
app.post('/api/scrape-competitors', async (req, res) => {
  try {
    // Get product details from request
    const { productId, productName, keywords } = req.body;
    
    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    // Create search query
    const searchQuery = keywords || productName;
    
    console.log(`Scraping started for: ${searchQuery}`);
    
    // Scrape Amazon and Flipkart in parallel
    const [amazonData, flipkartData] = await Promise.all([
      scrapeAmazon(searchQuery),
      scrapeFlipkart(searchQuery)
    ]);
    
    // Combine results
    const competitorData = {
      amazon: amazonData,
      flipkart: flipkartData,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Scraping completed for: ${searchQuery}`);
    
    // Return the data
    return res.status(200).json({ 
      success: true, 
      data: competitorData 
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({ 
      error: 'Error scraping competitor data',
      message: error.message 
    });
  }
});

/**
 * Scrape product data from Amazon
 */
async function scrapeAmazon(searchQuery) {
  try {
    console.log(`Scraping Amazon for: ${searchQuery}`);
    
    // Encode the search query for URL
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://www.amazon.in/s?k=${encodedQuery}`;
    
    // Set user agent to avoid blocking
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    };
    
    const response = await axios.get(url, { headers });
    const data = response.data;
    const $ = cheerio.load(data);
    
    console.log(`Amazon search page loaded for: ${searchQuery}`);
    
    // Extract top 3 product results
    const products = [];
    
    $('.s-result-item[data-component-type="s-search-result"]').slice(0, 3).each((i, el) => {
      const title = $(el).find('h2 .a-link-normal').text().trim();
      const priceText = $(el).find('.a-price .a-offscreen').first().text().trim();
      const price = priceText.replace(/[^0-9.]/g, ''); // Extract numbers only
      const rating = $(el).find('.a-icon-star-small .a-icon-alt').text().trim();
      const url = 'https://www.amazon.in' + $(el).find('h2 .a-link-normal').attr('href');
      
      if (title && price) {
        products.push({
          title,
          price: parseFloat(price) || 0,
          rating,
          url
        });
        
        console.log(`Amazon product found: ${title} - ${price}`);
      }
    });
    
    return {
      products,
      source: 'Amazon',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Amazon scraping error:', error);
    return {
      error: 'Error scraping Amazon',
      products: [],
      source: 'Amazon',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Scrape product data from Flipkart
 */
async function scrapeFlipkart(searchQuery) {
  try {
    console.log(`Scraping Flipkart for: ${searchQuery}`);
    
    // Encode the search query for URL
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://www.flipkart.com/search?q=${encodedQuery}`;
    
    // Set user agent to avoid blocking
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    };
    
    const response = await axios.get(url, { headers });
    const data = response.data;
    const $ = cheerio.load(data);
    
    console.log(`Flipkart search page loaded for: ${searchQuery}`);
    
    // Extract top 3 product results
    const products = [];
    
    // Flipkart's structure can vary, so we'll try different selectors
    // First, try the regular product card format
    $('._1AtVbE._3BhJnt, ._1YokD2._3Mn1Gg').slice(0, 10).each((i, el) => {
      const title = $(el).find('._4rR01T').text().trim() || $(el).find('.s1Q9rs').text().trim();
      const priceText = $(el).find('._30jeq3').text().trim();
      const price = priceText.replace(/[^0-9.]/g, ''); // Extract numbers only
      const rating = $(el).find('._3LWZlK').text().trim();
      const url = 'https://www.flipkart.com' + ($(el).find('a._1fQZEK').attr('href') || $(el).find('a.s1Q9rs').attr('href') || '');
      
      if (title && price) {
        products.push({
          title,
          price: parseFloat(price) || 0,
          rating,
          url
        });
        
        console.log(`Flipkart product found: ${title} - ${price}`);
      }
    });
    
    // If we didn't find any products with the above selectors, try alternative selectors
    if (products.length === 0) {
      console.log('Trying alternative Flipkart selectors');
      
      $('._1xHGtK._373qXS, ._4ddWXP').slice(0, 10).each((i, el) => {
        const title = $(el).find('.IRpwTa').text().trim() || $(el).find('._2WkVRV').text().trim();
        const priceText = $(el).find('._30jeq3').text().trim();
        const price = priceText.replace(/[^0-9.]/g, ''); // Extract numbers only
        const rating = $(el).find('._3LWZlK').text().trim();
        const url = 'https://www.flipkart.com' + ($(el).find('a._2UzuFa').attr('href') || $(el).find('a._2rpwqI').attr('href') || '');
        
        if (title && price) {
          products.push({
            title,
            price: parseFloat(price) || 0,
            rating,
            url
          });
          
          console.log(`Flipkart product found (alt selector): ${title} - ${price}`);
        }
      });
    }
    
    return {
      products: products.slice(0, 3), // Just take the first 3 products
      source: 'Flipkart',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Flipkart scraping error:', error);
    return {
      error: 'Error scraping Flipkart',
      products: [],
      source: 'Flipkart',
      timestamp: new Date().toISOString()
    };
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Scraper server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/scrape-competitors`);
});