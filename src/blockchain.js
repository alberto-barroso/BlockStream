const fs = require('fs').promises;
const Block = require('./block');
const Transaction = require('./transaction');
const SmartContract = require('./smartcontract');
const RBAC = require('./rbac');

class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 2;
        this.transactionPool = [];
        this.rbac = new RBAC();
        this.transactionFees = 0;
        this.miningReward = 100;
        this.contracts = [];
        this.transactionHistory = {};
        this.blacklistedAddresses = new Set();
        this.transactionLimits = {};
        this.transactionLimitsPeriod = {};
        this.multiSigWallets = {};
        this.loadChain();
        this.analytics = {
            transactions: 0,
            blocks: 0,
            addresses: new Set()
        };
    }

    // Method to get the blockchain
    getBlockchain() {
        return this.chain;
    }
    
    addBlock(block) {
        this.chain.push(block);
        this.analytics.blocks++;
        block.transactions.forEach(tx => {
            this.analytics.transactions++;
            this.analytics.addresses.add(tx.fromAddress);
            this.analytics.addresses.add(tx.toAddress);
        });
        return this.saveChain();
    }

    getAnalytics() {
        return this.analytics;
    }

    createMultiSigWallet(addresses, requiredSignatures) {
        const walletId = uuidv4();
        this.multiSigWallets[walletId] = { addresses, requiredSignatures, signatures: [] };
        return walletId;
    }

    signMultiSigTransaction(walletId, signature) {
        const wallet = this.multiSigWallets[walletId];
        if (!wallet) throw new Error('Wallet not found');
        wallet.signatures.push(signature);

        if (wallet.signatures.length >= wallet.requiredSignatures) {
            return true; // Transaction can be executed
        }
        return false; // More signatures needed
    }

    addRole(role) {
        this.rbac.addRole(role);
    }

    addPermissionToRole(role, permission) {
        this.rbac.addPermissionToRole(role, permission);
    }

    hasPermission(role, permission) {
        return this.rbac.hasPermission(role, permission);
    }
    
    async loadChain() {
        try {
            const chainData = await fs.readFile('./blockchain.json');
            this.chain = JSON.parse(chainData);
        } catch (error) {
            console.log('No blockchain found, creating genesis block');
            this.chain = [this.createGenesisBlock()];
            await this.saveChain();
        }
    }

    async saveChain() {
        await fs.writeFile('./blockchain.json', JSON.stringify(this.chain, null, 2));
    }

    // addBlock(block) {
    //     this.chain.push(block);
    //     return this.saveChain();
    // }

    createGenesisBlock() {
        return new Block(0, new Date().toISOString(), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.transactionPool.push(rewardTx);

        let totalFees = 0;
        this.transactionPool.forEach(tx => totalFees += tx.fee);

        const block = new Block(
            this.chain.length,
            new Date().toISOString(),
            this.transactionPool,
            this.getLatestBlock().hash
        );
        await block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        await this.addBlock(block);

        this.transactionFees += totalFees; // Update total fees collected
        this.transactionPool = [];
    }

    addTransaction(transaction, role) {
        if (!this.hasPermission(role, 'add_transaction')) {
            throw new Error('Permission denied');
        }
        // Check transaction limits before adding transaction
        this.checkTransactionLimit(transaction.fromAddress);
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        // Track transaction for tracing
        if (!this.transactionHistory[transaction.fromAddress]) {
            this.transactionHistory[transaction.fromAddress] = [];
        }
        this.transactionHistory[transaction.fromAddress].push(transaction);

        if (!this.transactionHistory[transaction.toAddress]) {
            this.transactionHistory[transaction.toAddress] = [];
        }
        this.transactionHistory[transaction.toAddress].push(transaction);

        // Check transaction limits
        const fromAddressLimit = this.transactionLimits[transaction.fromAddress];
        if (fromAddressLimit && fromAddressLimit.count <= 0) {
            throw new Error('Transaction limit exceeded for address: ' + transaction.fromAddress);
        }

        if (fromAddressLimit) {
            fromAddressLimit.count--;
        }

        this.transactionPool.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    async isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if the current block's transactions are valid
            if (!await currentBlock.hasValidTransactions()) {
                console.error(`Invalid transactions found in block ${currentBlock.index}`);
                return false;
            }

            // Verify that the current block's hash is correctly calculated
            const calculatedHash = currentBlock.calculateHash();
            if (currentBlock.hash !== calculatedHash) {
                console.error(`Block ${currentBlock.index} has an invalid hash`);
                console.error(`Expected hash: ${calculatedHash}`);
                console.error(`Actual hash: ${currentBlock.hash}`);
                return false;
            }

            // Verify that the previous block's hash matches the current block's previousHash
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.error(`Block ${currentBlock.index} has an invalid previous hash`);
                console.error(`Expected previous hash: ${previousBlock.hash}`);
                console.error(`Actual previous hash: ${currentBlock.previousHash}`);
                return false;
            }
        }
        return true;
    }

    async deployContract(code, gasLimit) {
        const contract = new SmartContract(code, gasLimit);
        this.contracts.push(contract);
        return contract;
    }

    async executeContract(index, context, role) {
        if (!this.hasPermission(role, 'execute_contract')) {
            throw new Error('Permission denied');
        }
        if (index >= this.contracts.length) {
            throw new Error('Contract index out of bounds');
        }
        const contract = this.contracts[index];
        const result = await contract.execute(context);
        return result;
    }

    traceTransaction(address) {
        return this.transactionHistory[address] || [];
    }

    blacklistAddress(address) {
        this.blacklistedAddresses.add(address);
    }

    unblacklistAddress(address) {
        this.blacklistedAddresses.delete(address);
    }
    // Method to set transaction limits with daily and hourly constraints
    setTransactionLimit(address, limit, period, type = 'hourly') {
        this.transactionLimits[address] = { limit, count: limit, period, type };

        // Set an interval to reset the count based on the limit type
        if (type === 'hourly') {
            setInterval(() => {
                this.transactionLimits[address].count = limit;
            }, period);
        } else if (type === 'daily') {
            setInterval(() => {
                this.transactionLimits[address].count = limit;
            }, period); // period should be in milliseconds, e.g., 24 * 60 * 60 * 1000 for daily
        } else {
            throw new Error('Invalid limit type');
        }
    }

    // Method to check and update transaction limits
    checkTransactionLimit(address) {
        const limitData = this.transactionLimits[address];
        if (limitData) {
            if (limitData.count <= 0) {
                throw new Error('Transaction limit exceeded for address: ' + address);
            }
            limitData.count--;
        }
    }

    stopTransactionIfBlacklisted(transaction) {
        if (this.blacklistedAddresses.has(transaction.fromAddress) || this.blacklistedAddresses.has(transaction.toAddress)) {
            throw new Error('Transaction involves blacklisted address');
        }
    }
}

module.exports = Blockchain;
