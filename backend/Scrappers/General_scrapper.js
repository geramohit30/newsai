const axios = require('axios');
const cheerio = require('cheerio');

async function guardianScraper(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const $ = cheerio.load(data);
        const article = $('[data-gu-name="body"]');
        const paragraphs = article.find('p');

        let fullText = '';
        paragraphs.each((i, el) => {
            fullText += $(el).text() + '\n\n';
        });

        return fullText.trim();
    } catch (err) {
        console.error("Guardian scraping failed:", err.message);
        return '';
    }
}

async function alJazeeraScraper(url) {
    console.log('Scraping Al Jazeera:', url);
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(data);
    const main = $('#main-content-area');

    let fullText = '';
    const subhead = main.find('p.article__subhead').first().text().trim();
    if (subhead) fullText += subhead + '\n\n';

    main.find('.wysiwyg--all-content p').each((i, el) => {
      const t = $(el).text().trim();
      if (t) fullText += t + '\n\n';
    });
    if (!fullText.trim()) {
      main.find('p').each((i, el) => {
        const t = $(el).text().trim();
        if (t) fullText += t + '\n';
      });
    }
    return fullText.trim();
  } catch (err) {
    console.error('Al Jazeera scraping failed:', err.message);
    return '';
  }
}

module.exports = {guardianScraper, alJazeeraScraper};