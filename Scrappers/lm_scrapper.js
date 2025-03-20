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
    try{
        const {data} =  await axios.get(url,{
                                httpsAgent: new https.Agent({rejectUnauthorized:false})
                            });
        const parsedData = parser.parse(data)
        const lm_data = parsedData['rss']['channel']['item'];
        console.log(lm_data);
        

    }
    catch(error){
        console.log('Error in scraping',error)
    }
    // const db = await connect();
    // const col = db.collection('headings')
    // try {
    //     const  {data}  = await axios.get(url,{
    //                     httpsAgent: new https.Agent({rejectUnauthorized:false})
    //                 });
    //             const parsedData = parser.parse(data)
    //                 console.log(parsedData['rss']['channel']['item']);
    //                 if(parsedData && parsedData['rss']['channel']['item']){
    //                     const dt =  parsedData['rss']['channel']['item'];
    //                     for ( ele of dt){
    //                         col.insertOne({data:ele});
    //                     }
    //                 }
    //                 return
      
    // } catch (error) {
    //     console.error('Error scraping website:', error.message);
    // }
}




async function summarize_data(data, image, keywords, heading) {
    const db = await connect();
    const col = db.collection('test-news');

    await delay(1000);
    const summ_text = await nlp(data);
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


// async function data_update(url) {
//     const db = await connect();
//     const col = db.collection('raw-news');
//     const col2 = db.collection('summarized-news');

//     const { data } = await axios.get(url, {
//         httpsAgent: new https.Agent({ rejectUnauthorized: false })
//     });

//     const $ = cheerio.load(data);
//     const articles = [];
//     const summ_articles_promises = [];

//     $('script[type^="application"]').each((_, element) => {
//         try {
//             const jsonText = $(element).html().trim();
//             const parsedata = JSON.parse(jsonText);

//             if (parsedata['@type'] === "NewsArticle" && (parsedata['headline'] && !parsedata['headline'].includes('India News Live'))) {
//                 summarize_data(parsedata['articleBody'],parsedata['image'],parsedata['keywords'],parsedata['headline'])
//             }
//         } catch (error) {
//             console.log('Error in LM scraping:', error.message);
//         }
//     });
//     console.log('OUT');
// }



async function scrapeWebsite() {
    // const db = await connect();
    // const col = db.collection('headings')
    // try {
    //     const all_data = col.find({});
        
    //     await all_data.forEach(doc=>{
    //         data_update(doc.data.link)
    //     })
      
    // } catch (error) {
    //     console.error('Error scraping website:', error.message);
    // }
}

scrapheadings('https://www.indiatoday.in/rss/home')

// scrapeWebsite();