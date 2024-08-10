const crypto = require('crypto');
const MerkleTree = require('./merkletree');

class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.merkleRoot = this.calculateMerkleRoot();
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.index + this.timestamp + JSON.stringify(this.transactions) + this.previousHash + this.nonce + this.merkleRoot)
            .digest('hex');
    }

    calculateMerkleRoot() {
        const merkleTree = new MerkleTree(this.transactions);
        return merkleTree.getRoot();
    }

    async mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block mined: ${this.hash}`);
    }

    async hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!await tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Block;
