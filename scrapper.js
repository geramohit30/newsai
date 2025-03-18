const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function scrapeWebsite(url) {
    try {
        // Fetch the HTML of the page
        const { data } = await axios.get(url,{
                        httpsAgent: new https.Agent({rejectUnauthorized:false})
                    });
        
        // Load the HTML into cheerio
        const $ = cheerio.load(data);
        await new Promise(res =>setTimeout(res,2000));
        // Select elements and extract data
        let scrapedData = [];
        
        $('.cartHolder').each((index, element) => {
            let url = '';
            let heading = $(element).find('h2.hdg3 a').text().trim();
            if (!heading) {
                heading = $(element).find('h3.hdg3 a').text().trim();
            }
            let imgTag = $(element).find('figure span a img');
            let imgSrc = imgTag.attr('src');
            url = $(element).find('h2.hdg3 a').attr('href');
            if (!url) {
                url = $(element).find('h3.hdg3 a').attr('href');
            }
            if (imgSrc && !imgSrc.includes('default')) {
                scrapedData.push({ heading, image: imgSrc, url: url });
            }else{
                scrapedData.push({ heading, image: '', url: url });
            }
        });
        
        // Save data to a JSON file
        fs.writeFileSync('scraped_data.json', JSON.stringify(scrapedData, null, 2));
        
        console.log('Scraped data saved to scraped_data.json');
    } catch (error) {
        console.error('Error scraping website:', error.message);
    }
}


scrapeWebsite('https://www.hindustantimes.com/india-news');