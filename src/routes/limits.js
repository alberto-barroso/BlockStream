const express = require('express');
const router = express.Router();

module.exports = function (blockstream) {
    router.post('/blacklistAddress', async (req, res) => {
        const { contractIndex, address } = req.body;
        try {
            const contract = blockstream.contracts[contractIndex];
            if (!contract) {
                return res.status(400).send('Contract not found');
            }
            contract.addAddressToBlacklist(address);
            res.send('Address blacklisted successfully');
        } catch (error) {
            res.status(400).send(error.message);
        }
    });

    router.post('/setTransactionLimit', (req, res) => {
        const { address, limit, period, type } = req.body;
        try {
            const periodMs = type === 'daily' ? 86400000 : 3600000;
            blockstream.setTransactionLimit(address, limit, periodMs, type);
            res.send('Transaction limit set successfully');
        } catch (error) {
            res.status(400).send(error.message);
        }
    });

    return router;
};
