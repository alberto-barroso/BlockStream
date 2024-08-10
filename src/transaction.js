const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class Transaction {
    constructor(fromAddress, toAddress, amount, fee = 0) {
        this.id = uuidv4();
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.fee = fee;
        this.timestamp = new Date().toISOString();
        this.signature = '';
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.id + this.fromAddress + this.toAddress + this.amount + this.fee + this.timestamp)
            .digest('hex');
    }

    signTransaction(privateKey) {
        // Convert private key to PEM format if not already
        const pemKey = this.convertToPEM(privateKey, 'private');

        // Create a signature
        const hashTx = this.calculateHash();
        const sign = crypto.createSign('SHA256');
        sign.update(hashTx);
        sign.end();
        this.signature = sign.sign(pemKey, 'hex');
    }

    async isValid() {
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const hashTx = this.calculateHash();
        const verify = crypto.createVerify('SHA256');
        verify.update(hashTx);
        verify.end();

        // Convert public key from address to PEM format if necessary
        const pemPublicKey = this.convertToPEM(this.fromAddress, 'public');
        return verify.verify(pemPublicKey, this.signature, 'hex');
    }

    convertToPEM(key, type) {
        if (key.startsWith('-----BEGIN')) return key;

        if (type === 'public') {
            return `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
        } else if (type === 'private') {
            return `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
        } else {
            throw new Error('Invalid key type');
        }
    }
}

module.exports = Transaction;
