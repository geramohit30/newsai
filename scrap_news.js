const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const article_arr = [];
async function scrapeArticleContent(article) {
    try {
        const { data } = await axios.get("https://www.hindustantimes.com/"+article.url);
        const $ = cheerio.load(data);
        
        let paragraphs = [];
        $('.detail p').each((index, element) => {
            let text = $(element).text().trim();
            if (text) {
                paragraphs.push(text);
            }
        });
        
        let articleData = {
            image: article.image,
            heading: article.heading,
            paragraphs: paragraphs
        };
        article_arr.push(articleData);
        
    } catch (error) {
        console.error(`Error fetching article: ${article.url}`, error.message);
    }
}

async function processScrapedData() {
    try {
        if (!fs.existsSync('scraped_data.json')) {
            console.error('Error: scraped_data.json not found. Run the scraper first.');
            return;
        }
        
        const rawData = fs.readFileSync('scraped_data.json');
        const scrapedData = JSON.parse(rawData);
        
        for (const article of scrapedData) {
            await scrapeArticleContent(article);
        }

        let filename = `articles.json`;
        fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(article_arr, null, 2));
        console.log(`Saved article content to ${filename}`);
    } catch (error) {
        console.error('Error processing scraped data:', error.message);
    }
}


processScrapedData();
