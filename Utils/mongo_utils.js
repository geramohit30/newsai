var {MongoClient} = require('mongodb');
var url = "mongodb+srv://sharmashivansh0782:sharmashivansh0782@scrapping.eiwsy.mongodb.net/?retryWrites=true&w=majority&appName=Scrapping";

const client = new MongoClient(url,{ useNewUrlParser: true, useUnifiedTopology: true, tls: true,tlsAllowInvalidCertificates: true })

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