import Web3 from "web3";
import chalk from "chalk";

// connect to geth websocket.
// I recommend running $ geth --syncmode "light" --ws
const web3 = new Web3("ws://127.0.0.1:8546");

let prev_block; // this is used as a sequential check
let prev_gas_price;
let sub = web3.eth.subscribe("newBlockHeaders");

// Console output string builder
const buildInfoString = (block, utilization, gas_price) =>
  `${new Date().toLocaleTimeString()} | New Block (${block}), Total Gas Used ${chalk.bgWhiteBright.bold.redBright(
    Math.round(utilization * 100) + "%"
  )}, Upcoming Base Fee will be ${chalk.bgWhiteBright.bold.redBright(
    Math.round((100 * gas_price) / 1e9) / 100 + " Gwei"
  )}.
  `;

sub.on("connected", function (subscriptionId) {
  console.log("Listening for new blocks...\n");
});

sub.on("data", function (blockHeader) {
  // can't do anything unless we know the previous blocks data
  const incremental_block = prev_block === blockHeader.number - 1;

  const utilization = blockHeader.gasUsed / blockHeader.gasLimit;
  // calculate next block base gas using EIP1559
  const next_gas_price = incremental_block
    ? blockHeader.baseFeePerGas * (1 + (0.125 * (utilization - 0.5)) / 0.5)
    : "N/A";

  prev_block = blockHeader.number;
  prev_gas_price = blockHeader.baseFeePerGas;

  console.log(buildInfoString(blockHeader.number, utilization, next_gas_price));
});

sub.on("error", ({ reason }) => console.error(reason));
