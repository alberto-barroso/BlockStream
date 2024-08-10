const express = require('express');
const router = express.Router();

const blockchainRoutes = require('./blockchain');
const transactionRoutes = require('./transactions');
const contractRoutes = require('./contracts');
const limitsRoutes = require('./limits');
const userRoutes = require('./users');
const walletRoutes = require('./wallets');
const notificationRoutes = require('./notifications');

module.exports = function (blockstream, p2pServer) {
    router.use('/blockchain', blockchainRoutes(blockstream, p2pServer));
    router.use('/transactions', transactionRoutes(blockstream));
    router.use('/contracts', contractRoutes(blockstream));
    router.use('/limits', limitsRoutes(blockstream));
    router.use('/users', userRoutes(blockstream));
    router.use('/wallets', walletRoutes(blockstream));
    router.use('/notifications', notificationRoutes(blockstream));

    return router;
};
