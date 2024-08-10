const express = require('express');
const router = express.Router();

module.exports = function (blockstream) {
    router.post('/deployContract', async (req, res) => {
        const { code, gasLimit } = req.body;
        try {
            const contract = await blockstream.deployContract(code, gasLimit);
            res.send({ message: 'Contract deployed successfully', contract });
        } catch (error) {
            res.status(400).send(error.message);
        }
    });

    router.post('/executeContract', async (req, res) => {
        const { index, context, role } = req.body;
        try {
            if (!blockstream.hasPermission(role, 'execute_contract')) {
                return res.status(403).send('Permission denied');
            }
            const result = await blockstream.executeContract(index, context);
            res.send({ message: 'Contract executed successfully', result });
        } catch (error) {
            res.status(400).send(error.message);
        }
    });

    return router;
};
