const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { json } = require('express/lib/response');
const fetch = require('node-fetch')
let {XMLParser} = require('fast-xml-parser');
const parser = new XMLParser();
const connect = require('./Utils/mongo_utils');

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

async function data_update(url) {
    const db = await connect();
    const col = db.collection('paras')

    const {data} = await axios.get(url,{
        httpsAgent: new https.Agent({rejectUnauthorized:false})
    })
    
   const $ = cheerio.load(data);
   const articles = [];
   $('script[type^="application"]').each((_,element)=>{
    try{
    const jsonText = $(element).html().trim();
    const parsedata = JSON.parse(jsonText);
    // console.log(parsedata);
    if(parsedata['@type']=="NewsArticle" && (parsedata['headline'] && !parsedata['headline'].includes('India News Live')))
articles.push(parsedata);
    }
    catch (error){
        console.log('Error in ht scrapping', error.message);
    }
   })
   if(articles.length>0){
    col.insertMany(articles)
   }
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