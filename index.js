// Import Express
const express = require('express');
const app = express();
const connect = require('./Utils/mongo_utils');

// Define a route
app.get('/', (req, res) => {
    res.send('Welcome to the Express.js Tutorial');
});
app.get('/news',async (req,res)=>{
    try{
        const db = await connect();
        const col = db.collection('paras')
    
        const data = await col.find({},{projection:{headline:1,articleBody:1,image:1,_id:0}}).toArray();
        res.json({data:data})
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