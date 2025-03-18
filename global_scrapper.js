// https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const parser = require('rss-parser');
const https = require('https');

async function scrapeWebsite() {
    try {
        const feed  = await parser.parseURL('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en');
        
        for (const item of feed.items){
            console.log(item)
        }
    } catch (error) {
        console.error('Error scraping website:', error.message);
    }
}


scrapeWebsite();