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
app.get('/news',async (req,res)=>{
    try{
        // const db = await connect();
        // const col = db.collection('paras')
    
        // const data = await col.find({},{projection:{headline:1,articleBody:1,image:1,_id:0}}).toArray();
        // res.json({data:data})
        fs.readFile(path.join(__dirname,"parsed_data.json"),"utf-8",(err,data)=>{
            if(err){
                return res.json({"success":"False", "msg":"Failed to parse data!"})
            }
            const jsonData = JSON.parse(data);
            const filteredData = jsonData.map(({headline,articleBody,image})=>({headline,articleBody,image}))
            res.json(filteredData);
        })
    }
    catch(error){
        console.log('Getting error', error);
        res.send('Error')
    }
    
})
// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});