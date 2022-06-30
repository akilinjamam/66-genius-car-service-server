const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

app.listen(port, () => {
    console.log('listening to port', port)
});

// middleware
app.use(cors())
app.use(express.json());

function verifyJWT(req, res, next) {

    const authHeder = req.headers.authorization
    if (!authHeder) {
        return res.status(401).send({ message: 'unauthorize access' });
    }
    const token = authHeder.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }

        console.log('decoded', decoded);
        req.decoded = decoded;
        next()

    })



}

app.get('/', (req, res) => {
    res.send('Running Genius Server');

})


app.get('/hero', (req, res) => {
    res.send('server is now to heroku')
})





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8g7kb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order')
        const completeCollection = client.db('geniusCar').collection('complete');
        const doneCollection = client.db('geniusCar').collection('done');

        // Auth  
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accesToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ accesToken })

        })



        // service api
        app.get('/service', async (req, res) => {

            const query = {};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);

        })

        app.get('/checkout/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);

        })

        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService)
            res.send(result)
        })

        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
        })

        // order collection API

        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                console.log(email)
                const query = { email: email }
                const cursor = orderCollection.find(query)
                const orders = await cursor.toArray()
                res.send(orders)
            }

            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })

        app.post('/order', async (req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.send(result)

        })


        // this part is for task management website.

        app.get('/complete', async (req, res) => {

            const query = {}
            const cursor = completeCollection.find(query);
            const complete = await cursor.toArray();
            res.send(complete)
        })

        app.post('/complete', async (req, res) => {

            const theTask = req.body;
            const result = await completeCollection.insertOne(theTask);
            res.send(result)
        })

        app.post('/done', async (req, res) => {

            const theDeed = req.body;
            const result = await doneCollection.insertOne(theDeed);
            res.send(result)
        })

        app.get('/done', async (req, res) => {

            const query = {}
            const cursor = doneCollection.find(query);
            const done = await cursor.toArray();
            res.send(done)
        })


        app.put('/complete/:id', async (req, res) => {
            const id = req.params.id;
            const updateTaskData = req.body
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    task: updateTaskData.task
                }
            };

            const result = await completeCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
    }
    finally {

    }

}

run().catch(console.dir)