import Web3 from "web3";
import chalk from "chalk";

// connect to geth websocket.
// I recommend running $ geth --syncmode "light" --ws
const web3 = new Web3("ws://127.0.0.1:8546");

let prev_block; // this is used as a sequential check
let prev_gas_price;
let prev_utilization;

let sub = web3.eth.subscribe("newBlockHeaders");

// Console output string builder
const buildInfoString = (utilization, gas_price) =>
  `New Block, Total Gas Used ${chalk.bgWhiteBright.bold.redBright(
    Math.round(utilization * 100) + "%"
  )}, Upcoming Gas Price will be ${chalk.bgWhiteBright.bold.redBright(
    Math.round(gas_price / 1e9, 2) + " Gwei"
  )}.
  `;

sub.on("connected", function (subscriptionId) {
  console.log("Listening for new blocks...\n");
});

sub.on("data", function (blockHeader) {
  // can't do anything unless we know the previous blocks data
  const incremental_block = prev_block === blockHeader.number - 1;
  // calculate next block base gas using EIP1559
  const next_gas_price = incremental_block
    ? prev_gas_price * (1 + (0.125 * (prev_utilization - 0.5)) / 0.5)
    : "N/A";

  prev_block = blockHeader.number;
  prev_gas_price = blockHeader.baseFeePerGas;
  prev_utilization = blockHeader.gasUsed / blockHeader.gasLimit;

  console.log(buildInfoString(prev_utilization, next_gas_price));
});

sub.on("error", ({ reason }) => console.error(reason));
