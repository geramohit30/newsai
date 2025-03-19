// Import Express
const express = require('express');
const app = express();
const connect = require('./Utils/mongo_utils');
const fs = require('fs')
const path = require('path')

// Define a route
app.get('/', (req, res) => {
    res.send('Welcome to the Express.js Tutorial');
});
app.get('/headlines',async(req,res)=>{
    const db = await connect();
        const col = db.collection('raw-news')
    
        const data = await col.find({},{projection:{headline:1,description:1,keywords:1,image:1,_id:0}}).toArray();
        res.json({data:data})
})

app.get('/news',async (req,res)=>{
    try{
        const db = await connect();
        const col = db.collection('summarized-news')
    
        const data = await col.find({},{projection:{heading:1,keywords:1,data:1,image:1,_id:0}}).toArray();
        const filter_data = data
    .filter(elem => elem.data && elem.data.trim() !== "") // Removes empty or whitespace-only data
    .map(elem => ({
        heading: elem.heading,
        keywords: elem.keywords,
        data: elem.data,
        image: elem.image.url
    }));
        res.json({data:filter_data})
    }
    catch(error){
        console.log('Getting error', error);
        res.send('Error')
    }
    
})

app.get('/raw-news',async (req,res)=>{
    try{
        const db = await connect();
        const col = db.collection('raw-news')
    
        const data = await col.find({},{projection:{headline:1,articleBody:1,image:1,_id:0}}).toArray();
        res.json({data:data})
    }
    catch(error){
        console.log('Getting error', error);
        res.send('Error')
    }
    
})
app.get('/random',(req,res)=>{
    res.send('Hola')})
// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});