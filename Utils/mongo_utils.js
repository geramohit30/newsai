var {MongoClient} = require('mongodb');
var url = "mongodb://172.17.0.3:27017";

const client = new MongoClient(url,{useUnifiedTopology:true})
async function connect() {
    try{
        if(!client.topology || !client.topology.isConnected()){
            await client.connect()
        }
        return client.db('SP')
    }
    catch(error){
        console.log('Error while connecting to mongo', error);
        throw error;
    }
}

module.exports = connect;