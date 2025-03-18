const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

let {XMLParser} = require('fast-xml-parser');
const parser = new XMLParser();

const g_url = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en'

async function scrapeWebsite(url) {
    try {
    const  {data}  = await axios.get(g_url,{
                httpsAgent: new https.Agent({rejectUnauthorized:false})
            });
            
        const parsedData = parser.parse(data)
            console.log(parsedData['rss']['channel']['item']);
            
    } catch (error) {
        console.error('Error scraping website:', error);
    }
}


scrapeWebsite('https://www.hindustantimes.com/');