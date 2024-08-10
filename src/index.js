const express = require('express');
const Blockchain = require('./blockchain');
const P2PServer = require('./p2p');
const routes = require('./routes');
const dotenv = require('dotenv');

const environment = process.env.NODE_ENV || 'dev';
dotenv.config({ path: `.env.${environment}` });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Create a single instance of Blockchain
const blockstream = new Blockchain();
const p2pServer = new P2PServer(blockstream);

// Pass blockstream and p2pServer to routes
app.use('/', routes(blockstream, p2pServer));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

p2pServer.listen();
