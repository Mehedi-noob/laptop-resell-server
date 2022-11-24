const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


const app = express();

app.use(cors());
app.use(express.json());

//mongodb start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rh6ekch.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// mongodb start 
async function run() {
    try {
        // servers collection 
        const categoryCollection = client.db('laptopResell').collection('LCategory');
        // category api
        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        });

    }
    finally {

    }
}
run().catch(error => console.log(error));
// mongodb end 

app.get('/', async (req, res) => {
    res.send('server running');
})

app.listen(port, () => {
    console.log(`server running on ${port}`);
});