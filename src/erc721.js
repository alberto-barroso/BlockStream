class ERC721 {
    constructor(name, symbol) {
        this.name = name;
        this.symbol = symbol;
        this.tokens = new Map();
    }

    mint(to, tokenId) {
        if (this.tokens.has(tokenId)) {
            throw new Error('Token already minted');
        }
        this.tokens.set(tokenId, to);
    }

    ownerOf(tokenId) {
        return this.tokens.get(tokenId);
    }

    transfer(from, to, tokenId) {
        if (this.tokens.get(tokenId) === from) {
            this.tokens.set(tokenId, to);
            return true;
        }
        return false;
    }
}

module.exports = ERC721;
