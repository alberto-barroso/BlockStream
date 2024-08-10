const Sandbox = require('./sandbox');

class SmartContract {
    constructor(code, gasLimit = 1000000) {
        this.code = code;
        this.sandbox = new Sandbox();
        this.gasLimit = gasLimit;
        this.transactionLimits = {};
        this.blacklist = new Set();
    }

    setTransactionLimit(address, limit) {
        this.transactionLimits[address] = limit;
    }

    isAddressBlacklisted(address) {
        return this.blacklist.has(address);
    }

    addAddressToBlacklist(address) {
        this.blacklist.add(address);
    }

    async execute(context) {
        const { address, amount, gas } = context;

        if (gas > this.gasLimit) {
            throw new Error('Gas limit exceeded');
        }

        // Check if address is blacklisted
        if (this.isAddressBlacklisted(address)) {
            throw new Error('Address is blacklisted');
        }

        // Check transaction limits
        if (this.transactionLimits[address] && amount > this.transactionLimits[address]) {
            throw new Error('Transaction exceeds limit');
        }

        // Execute contract code
        const result = await this.sandbox.execute(this.code, context);
        return result;
    }
}

module.exports = SmartContract;
