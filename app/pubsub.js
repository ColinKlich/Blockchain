const PubNub = require("pubnub");

const credentials = {
  publiskKey: "pub-c-0935fabc-e419-4e47-8739-7d4df6ed6dbc",
  subKey: "sub-c-e6215455-8197-4541-a975-bd021c619553",
  secretKey: "sec-c-NGM3ZTYwYzQtMzAzNi00ZGI5LTgzOTgtZmM1YWVhZDNmODNl",
};

const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN",
  TRANSACTION: "TRANSACTION",
};

class PubSub {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;

    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.listener());
  }

  handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
            chain: parsedMessage,
          });
        });
        break;
      case CHANNELS.TRANSACTION:
        if (
          !this.transactionPool.existingTransaction({
            inputAddress: this.wallet.publicKey,
          })
        ) {
          this.transactionPool.setTransaction(parsedMessage);
        }
        break;
      default:
        return;
    }
  }

  listener() {
    return {
      message: (messageObject) => {
        const { channel, message } = messageObject;

        this.handleMessage(channel, message);
      },
    };
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;
