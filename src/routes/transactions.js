const express = require('express');
const router = express.Router();
const Transaction = require('../transaction');

module.exports = function (blockstream) {
    router.post('/addTransaction', async (req, res) => {
        const { fromAddress, toAddress, amount, fee, role } = req.body;
        try {
            if (!blockstream.hasPermission(role, 'add_transaction')) {
                return res.status(403).send('Permission denied');
            }
            const newTx = new Transaction(fromAddress, toAddress, amount, fee);
            blockstream.addTransaction(newTx);
            res.send({ message: 'Transaction added successfully' });
        } catch (error) {
            res.status(400).send(error.message);
        }
    });

    return router;
};
