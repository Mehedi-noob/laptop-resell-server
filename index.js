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
        // collections
        const categoryCollection = client.db('laptopResell').collection('LCategory');
        const productCollection = client.db('laptopResell').collection('productCollection');
        const userCollection = client.db('laptopResell').collection('users');
        const bookingCollection = client.db('laptopResell').collection('booking');
        // category api
        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        });

        // products api 
        app.get('/category/:name', async (req, res) => {
            const name = req.params.name;
            const query = { categoryName: name };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
            console.log(products);
        });
        // Posting users 
        app.post('/users', async (req, res) => {
            const user = req.body;
            email = user.email;
            const query = { email };

            let postedUser = await userCollection.findOne(query);
            if (postedUser === null) {
                postedUser = {}
            }
            console.log(postedUser.email, email)
            if (postedUser.email !== email) {
                const result = userCollection.insertOne(user);
                res.send(result)
            }

        })
        // booking laptop 
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = {productId: booking.productId};
            console.log('productId ', booking.productId);
            let alreadyBooked = await bookingCollection.findOne(query);
            
            console.log(alreadyBooked, 'alreadyBooked');
            if (alreadyBooked?.productId !== booking.productId){
                const result = await bookingCollection.insertOne(booking);
                res.send(result);
            }            
            else{
                res.send({message: "not possible"})
            }
        })
        // my orders
        app.get('/booking/:email', async (req, res) => {
            const email = req.params.email;
            const query = { buyersEmail: email };
            const cursor = bookingCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
            console.log(products);
        });
        // add product 
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result)
        })
        app.get('/addproduct/:email', async (req, res) => {
            const email = req.params.email;
            const query = { sellerEmail: email };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        // adertize api 
        app.put('/myproduct/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isAdvertized: true,
                },
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        // get users according to email 
        app.get('/users', async (req, res) => {
            const role = req.query.role;
            const query = { role };
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
            console.log(users);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
            console.log(users);
        });
        // data edit api 
        // app.get('/users', async (req, res) => {
        //     const filter = {}
        //     const options = { upsert: true }
        //     const updatedDoc = {
        //         $set: {
        //             isVerified: false
        //         }
        //     }
        //     const result = await userCollection.updateMany(filter, updatedDoc, options);
        //     res.send(result);
        // })

        // user verification 
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isVerified: true,
                },
            };
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
        //   user deletion
        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await userCollection.deleteOne(filter);
            res.send(result)
        })
        // advertize section 
        app.get('/advertize', async (req, res) => {
            const query = { isAdvertized: true };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
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