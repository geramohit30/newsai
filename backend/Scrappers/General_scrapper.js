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

async function bbcScrapper(url) {
  console.log('🔎 Scraping BBC URL:', url);

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const $ = cheerio.load(html);
    const textContent = [];
    const section = $('section#block-2');
    if (section.length) {
      section.find('p.sm-text__text').each((_, el) => {
        const text = $(el).text().replace(/\u00a0/g, ' ').trim();
        if (text) textContent.push(text);
      });
    }
    if (textContent.length < 50) {
      $('div[data-component="text-block"] p').each((_, el) => {
        const text = $(el).text().replace(/\u00a0/g, ' ').trim();
        if (text) textContent.push(text);
      });
    }
    const fullText = textContent.join('\n\n');
    return fullText;
  } catch (err) {
    console.error('❌ Error scraping BBC:', err.message);
    return '';
  }
}

module.exports = {guardianScraper, alJazeeraScraper, bbcScrapper};