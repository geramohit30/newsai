const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { json } = require('express/lib/response');
let {XMLParser} = require('fast-xml-parser');
const parser = new XMLParser();
const connect = require('../Utils/mongo_utils');
const summarizeText = require('../Summarize/hugging_face')
const nlp = require('../Summarize/nlp')

const MAX_LENGTH = 1000;
async function scrapheadings(url) {
    const db = await connect();
    const col = db.collection('headings')
    try {
        const  {data}  = await axios.get(url,{
                        httpsAgent: new https.Agent({rejectUnauthorized:false})
                    });
                const parsedData = parser.parse(data)
                    console.log(parsedData['rss']['channel']['item']);
                    if(parsedData && parsedData['rss']['channel']['item']){
                        const dt =  parsedData['rss']['channel']['item'];
                        for ( ele of dt){
                            col.insertOne({data:ele});
                        }
                    }
                    return
      
    } catch (error) {
        console.error('Error scraping website:', error.message);
    }
}

let count = 0
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function preprocessText(articleBody) {
    return articleBody
        .replace(/\b(according to|quoted by|reported by) (PTI|ANI|news agency ANI|HT)\b/g, "")
        .replace(/\b(Also read|ALSO READ | UP:|BENGALURU:)\b/g, "")
        .replace(/\b(Nagpur Police Commissioner|Maharashtra chief minister|Union minister | minister)\b/g, "")
        .replace(/\s+/g, " ") 
        .trim();
}

function splitTextIntoChunks(text, chunkSize = 4000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}

async function summarizeInChunks(articleBody) {
    const text = preprocessText(articleBody);
    const chunks = splitTextIntoChunks(text);
    const summaries = [];

    for (const chunk of chunks) {
        const summary = await summarizeText(chunk);
        summaries.push(summary);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Avoid API rate limits
    }

    return summaries.join(" ");
}



async function summarize_data(data, image, keywords, heading) {
    const db = await connect();
    const col = db.collection('test-news');

    await delay(1000);
    const proc_data = preprocessText(data)
    const summ_text = await nlp(proc_data);
    console.log('Summ : ',summ_text)
    if(!summ_text){
        console.log('Got empty result');
        return;
    }
    await col.insertOne({
        "heading": heading,
        "keywords": keywords,
        "data": summ_text,
        "image": image
    });

}


async function data_update(url) {
    const db = await connect();
    const col = db.collection('raw-news');
    const col2 = db.collection('summarized-news');

    const { data } = await axios.get(url, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    const $ = cheerio.load(data);
    const articles = [];
    const summ_articles_promises = [];

    $('script[type^="application"]').each((_, element) => {
        try {
            const jsonText = $(element).html().trim();
            const parsedata = JSON.parse(jsonText);

            if (parsedata['@type'] === "NewsArticle" && (parsedata['headline'] && !parsedata['headline'].includes('India News Live'))) {
                summarize_data(parsedata['articleBody'],parsedata['image'],parsedata['keywords'],parsedata['headline'])
            }
        } catch (error) {
            console.log('Error in HT scraping:', error.message);
        }
    });
    console.log('OUT');
}



async function scrapeWebsite() {
    const db = await connect();
    const col = db.collection('headings')
    try {
        const all_data = col.find({});
        
        await all_data.forEach(doc=>{
            data_update(doc.data.link)
        })
      
    } catch (error) {
        console.error('Error scraping website:', error.message);
    }
}

// scrapheadings('https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml')

scrapeWebsite();