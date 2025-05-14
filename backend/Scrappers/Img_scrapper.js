const axios = require('axios');
const cheerio = require('cheerio');

async function fetchBingImages(keywordsStr, count = 3) {
    if(!keywordsStr || keywordsStr.length==0) return [];
    const keywords = keywordsStr.toLowerCase().split(',').map(k => k.trim());
    const query = encodeURIComponent(keywords.join(' '));
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1&tsc=ImageBasicHover`;

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    };

    try {
        // Fetch the HTML content of Bing's search results page
        const res = await axios(url, { headers });
        const html = res.data;

        // Load HTML into Cheerio for parsing
        const $ = cheerio.load(html);

        const images = [];

        // Extract image metadata from each result
        $('a.iusc').each((i, el) => {
            if (i >= count) return false; // Stop after reaching the desired count

            try {
                // Parse JSON metadata from the 'm' attribute
                const meta = JSON.parse($(el).attr('m'));
                if (meta && meta.murl) {
                    // Push full-size image URL into the results array
                    images.push({ url: meta.murl, priority: i + 1 });
                }
            } catch (err) {
                console.error('Error parsing image metadata:', err);
            }
        });

        return images;
    } catch (error) {
        console.error('Failed to fetch Bing images:', error);
        return [];
    }
}

module.exports = fetchBingImages;
