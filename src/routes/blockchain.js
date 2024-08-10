const express = require('express');
const router = express.Router();

module.exports = function (blockstream, p2pServer) {
    router.get('/', (req, res) => {
        res.json(blockstream.getBlockchain());
    });

    router.get('/isChainValid', async (req, res) => {
        try {
            const isValid = await blockstream.isChainValid();
            res.json({ isValid });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    router.get('/balance/:address', (req, res) => {
        try {
            const balance = blockstream.getBalanceOfAddress(req.params.address);
            res.json({ balance });
        } catch (error) {
            res.status(500).send(error.message);
        }
    });

    return router;
};
