const crypto = require('crypto');

class MerkleTree {
    constructor(transactions) {
        this.leaves = transactions.map(tx => this.hash(tx));
        this.tree = this.buildTree(this.leaves);
    }

    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    buildTree(leaves) {
        if (leaves.length === 0) return []; // Handle edge case of empty leaves
        if (leaves.length === 1) return leaves; // Base case: only one element, return as root

        const treeLevel = [];
        for (let i = 0; i < leaves.length; i += 2) {
            const left = leaves[i];
            const right = i + 1 < leaves.length ? leaves[i + 1] : left; // Duplicate last leaf if odd number of leaves
            const hash = this.hash(left + right);
            treeLevel.push(hash);
        }

        // Recursively build tree
        return this.buildTree(treeLevel);
    }

    getRoot() {
        return this.tree[0];
    }
}

module.exports = MerkleTree;
