# Eth Gas Viewer

This project is a simple script that reads eth client data and presents the current gas environment in realtime. I built this because etherscan and other websites struggle to offer a realtime view with enough context besides recommendations on what gas prices to use.

## How to run

The first step is to install geth: https://geth.ethereum.org/docs/install-and-build/installing-geth

Once you have that on your system, I highly recommend spinning up a ~light client~ as it's much quicker to operate and provides the necessary data

```
geth --syncmode "light" --ws
```

The `--ws` flag tells geth to offer a websocket endpoint, which we need in order to get a realtime data feed of new block headers being sent around the network.

Then, while the light client is running:

1. clone this repo
2. Enter into it
3. `node index.js`

You should be up and running. The default websocket address should be `ws://127.0.0.1:8546`. You can see it print out in the geth console. If it's something different, update the address in `index.js`.
