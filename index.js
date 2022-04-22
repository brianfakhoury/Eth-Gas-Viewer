import Web3 from "web3";
import chalk from "chalk";
import boxen from "boxen";

// connect to geth websocket.
// I recommend running $ geth --syncmode "light" --ws
const web3 = new Web3("ws://127.0.0.1:8546");

let sub = web3.eth.subscribe("newBlockHeaders");

// hide cursor
process.stdout.write("\u001b[?25l");

// Console output string builder
const buildInfoString = (block, utilization, gas_price) =>
  `New Block (${block.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")})
Total Gas Used ${chalk.bold.redBright(Math.round(utilization * 100) + "%")}
Upcoming Base Fee will be ${chalk.bold.redBright(
    Math.round((100 * gas_price) / 1e9) / 100 + " Gwei"
  )}.
  `;

const buildHighlightedInfoString = (block, utilization, gas_price) =>
  `New Block (${block.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")})
Total Gas Used ${chalk.bgRedBright.bold.whiteBright(
    Math.round(utilization * 100) + "%"
  )}
Upcoming Base Fee will be ${chalk.bgRedBright.bold.whiteBright(
    Math.round((100 * gas_price) / 1e9) / 100 + " Gwei"
  )}.
    `;

const buildConsoleBox = (highlight = false, params) =>
  boxen(
    highlight
      ? buildHighlightedInfoString(...params)
      : buildInfoString(...params),
    {
      title: `Updated: ${new Date().toLocaleTimeString()}`,
      titleAlignment: "center",
      borderStyle: "double",
      padding: 1,
      float: "center",
      width: 50,
    }
  );

sub.on("connected", function (subscriptionId) {
  console.log("Listening for new blocks...\n");
});

// prevent race conditions by storing string invariants globally
let latest_data = [];

sub.on("data", function (blockHeader) {
  // can't do anything unless we know the previous blocks data

  const utilization = blockHeader.gasUsed / blockHeader.gasLimit;
  // calculate next block base gas using EIP1559
  const next_gas_price =
    blockHeader.baseFeePerGas * (1 + (0.125 * (utilization - 0.5)) / 0.5);

  latest_data = [blockHeader.number, utilization, next_gas_price];

  // publish latest info highlighted, override previous data
  console.clear();
  console.log(buildConsoleBox(true, latest_data));

  // remove highlighting after 2000ms
  // do not use old data if new headers received
  setTimeout(() => {
    console.clear();
    console.log(buildConsoleBox(false, latest_data));
  }, 2000);
});

sub.on("error", ({ reason }) => {
  console.error(reason);
});

// restore hidden cursor for convenience
process.on("SIGINT", () => {
  process.stdout.write("\u001b[?25h");
  process.exit(2);
});
process.on("exit", () => {
  process.stdout.write("\u001b[?25h");
});
