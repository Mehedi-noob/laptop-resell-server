const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;


const app = express();

app.use(cors());
app.use(express.json());

//mongodb start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rh6ekch.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('This section is Not Authorized');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'This section is Forbidded' })
        }
        req.decoded = decoded;
        next();
    })

}


// mongodb start 
async function run() {
    try {
        // collections
        const categoryCollection = client.db('laptopResell').collection('LCategory');
        const productCollection = client.db('laptopResell').collection('productCollection');
        const userCollection = client.db('laptopResell').collection('users');
        const bookingCollection = client.db('laptopResell').collection('booking');
        const paymentsCollection = client.db('laptopResell').collection('payments');

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
            let alreadyBooked = await bookingCollection.findOne(query);
            const checkUser = booking.buyersEmail;
            
            console.log(alreadyBooked, 'alreadyBooked');
            if (alreadyBooked?.productId !== booking.productId && alreadyBooked?.buyersEmail !== checkUser){
                const result = await bookingCollection.insertOne(booking);
                res.send(result);
            }            
            else{
                res.send({message: "not possible"})
            }
        })
        // my orders
        app.get('/booking/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { buyersEmail: email };
            const cursor = bookingCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
            console.log(products);
        });
        // payment 
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { productId: id };
            const product = await bookingCollection.findOne(query);
            res.send(product);
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
        // delete product
        app.delete('/myproduct/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result)
        })

        // get users according to email 
        app.get('/users',verifyJWT, async (req, res) => {
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
        // app.get('/productedit', async (req, res) => {
        //     const filter = {}
        //     const options = { upsert: true }
        //     const updatedDoc = {
        //         $set: {
        //             isAvailable: true
        //         }
        //     }
        //     const result = await productCollection.updateMany(filter, updatedDoc, options);
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
        // check admin 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        // check seller 
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

        // advertize section 
        app.get('/advertize',verifyJWT, async (req, res) => {
            const query = { isAdvertized: true };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        // transaction api 
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const price = booking.resalePrice;
            const amount = price * 100;
      
            const paymentIntent = await stripe.paymentIntents.create({
              currency: "usd",
              amount: amount,
              payment_method_types: [
                "card"
              ],
            });
            res.send({
              clientSecret: paymentIntent.client_secret,
            });
          });
      
          app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)}
      
            const productId = payment.productId;
            const query = { _id:ObjectId(productId) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
      
            const updatedDoc2 = {
              $set: {
                isAdvertized: false,
                isAvailable: false
              }
          }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
            const updatedResult2 = await productCollection.updateOne(query, updatedDoc2)
            res.send(result);
          })
        //   report to admin 
        // app.delete('/myproduct/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) };
        //     const result = await productCollection.deleteOne(filter);
        //     res.send(result)
        // })
        app.put('/report/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isReported: true,
                },
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
        app.get('/report', async (req, res) => {
            const query = {isReported: true}
            const cursor = productCollection.find(query);
            const reportedItems = await cursor.toArray();
            res.send(reportedItems);
        })
        // jwt 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
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