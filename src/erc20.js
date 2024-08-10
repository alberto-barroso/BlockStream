class ERC20 {
    constructor(name, symbol, initialSupply) {
        this.name = name;
        this.symbol = symbol;
        this.totalSupply = initialSupply;
        this.balances = {};
    }

    balanceOf(address) {
        return this.balances[address] || 0;
    }

    transfer(from, to, amount) {
        if (this.balances[from] >= amount) {
            this.balances[from] -= amount;
            this.balances[to] = (this.balances[to] || 0) + amount;
            return true;
        }
        return false;
    }

    mint(address, amount) {
        this.totalSupply += amount;
        this.balances[address] = (this.balances[address] || 0) + amount;
    }
}

module.exports = ERC20;
