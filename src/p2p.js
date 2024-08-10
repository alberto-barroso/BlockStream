const WebSocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

class P2PServer {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    listen() {
        const server = new WebSocket.Server({ port: P2P_PORT });
        server.on('connection', socket => this.connectSocket(socket));
        this.connectToPeers();
        console.log(`Listening for peer-to-peer connections on: ${P2P_PORT}`);
    }

    connectToPeers() {
        peers.forEach(peer => {
            const socket = new WebSocket(peer);
            socket.on('open', () => this.connectSocket(socket));
        });
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log('Socket connected');

        this.messageHandler(socket);
        this.sendChain(socket);
    }

    messageHandler(socket) {
        socket.on('message', async message => {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'CHAIN':
                    await this.handleChain(data.chain);
                    break;
                case 'TRANSACTION':
                    this.blockchain.addTransaction(data.transaction);
                    break;
                case 'CLEAR_TRANSACTIONS':
                    this.blockchain.clearTransactions();
                    break;
                case 'BLACKLIST':
                    this.blockchain.blacklistAddress(data.address);
                    break;
                case 'UNBLACKLIST':
                    this.blockchain.unblacklistAddress(data.address);
                    break;
            }
        });
    }

    async handleChain(chain) {
        const latestBlock = this.blockchain.getLatestBlock();
        const receivedChainLength = chain.length;
        const currentChainLength = this.blockchain.chain.length;

        if (receivedChainLength > currentChainLength) {
            await this.blockchain.replaceChain(chain);
        }
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: 'CHAIN',
            chain: this.blockchain.chain
        }));
    }

    syncChains() {
        this.sockets.forEach(socket => this.sendChain(socket));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: 'TRANSACTION',
                transaction
            }));
        });
    }

    broadcastClearTransactions() {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: 'CLEAR_TRANSACTIONS'
            }));
        });
    }

    broadcastBlacklistAddress(address) {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: 'BLACKLIST',
                address
            }));
        });
    }

    broadcastUnblacklistAddress(address) {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: 'UNBLACKLIST',
                address
            }));
        });
    }
}

module.exports = P2PServer;
