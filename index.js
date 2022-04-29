import Web3 from "web3";
import net from "net";
import chalk from "chalk";
import boxen from "boxen";

let global_screen_params;
process.stdout.write("\u001b[?25l");
logbox("Boot", "Attempting to connect to client.\n\n");
// connect to geth .
// I recommend running $ geth --syncmode "light"
let provider;
let web3;
let sub;

let connection_attemps = 0;

const connection_timeout = setTimeout(() => {
  provider = new Web3.providers.IpcProvider(
    "/Users/brianfakhoury/Library/Ethereum/geth.ipc",
    net
  );
  web3 = new Web3(provider);
  sub = web3.eth.subscribe("newBlockHeaders");
  connection_attemps += 1;
  //
  // Top level handling
  //
  provider.on("error", (e) => {
    logbox("Error", `Trying to reconnect.\nAttempts: ${connection_attemps}\n`);
    connection_timeout.refresh();
  });
  provider.on("end", (e) => {
    logbox("Error", `Trying to reconnect.\nAttempts: ${connection_attemps}\n`);
    connection_timeout.refresh();
  });
  provider.on("connect", () => {
    connection_attemps = 0;
    run();
  });
}, 3000);

//
// pure functions
//
const infoString = (
  { number: blockNumber },
  utilization,
  gas_price,
  highlight = false
) => {
  // set chalk formatters
  const format = chalk.bold.redBright;
  const formatHighlighted = chalk.bgRedBright.bold.whiteBright;

  // calculate variables
  let _blockNumber = blockNumber
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let _utilization = Math.round(utilization * 100) + "%";
  let _gasPrice = Math.round((100 * gas_price) / 1e9) / 100 + " Gwei";

  // apply formats
  if (highlight) {
    _utilization = formatHighlighted(_utilization);
    _gasPrice = formatHighlighted(_gasPrice);
  } else {
    _utilization = format(_utilization);
    _gasPrice = format(_gasPrice);
  }
  return `New Block (${_blockNumber})
Total Gas Used ${_utilization}
Upcoming Base Fee will be ${_gasPrice}.`;
};

//
// screen render
//
function logbox(title, str, time_str = new Date().toLocaleTimeString()) {
  global_screen_params = [title, str];

  console.clear();

  const box =
    "\n" +
    boxen(str, {
      title: `${title} | ${time_str}`,
      titleAlignment: "center",
      borderStyle: "double",
      padding: 1,
      float: "center",
      width: 50,
    });

  console.log(box);
}

//
// main event logic
//
const run = () => {
  sub.on("connected", () => {
    logbox("Info", "Listening for new blocks...\n\n");
  });

  // prevent race conditions by storing string invariants globally
  let latest_data = [];
  // set timer for staleness display
  let stale_timeout = setTimeout(() => {
    logbox("Info", "No new block headers detected.\nStill listening...\n");
  }, 60 * 1000);

  let highlight_timeout = setTimeout(() => {
    if (latest_data.length) {
      logbox(
        "Block Time",
        infoString(...latest_data),
        new Date(latest_data[0].timestamp * 1000).toLocaleTimeString()
      );
    }
  }, 2000);

  sub.on("data", (blockHeader) => {
    stale_timeout.refresh(); // reset staleness

    const utilization = blockHeader.gasUsed / blockHeader.gasLimit;
    // calculate next block base gas using EIP1559
    const next_gas_price =
      blockHeader.baseFeePerGas * (1 + (0.125 * (utilization - 0.5)) / 0.5);

    latest_data = [blockHeader, utilization, next_gas_price];

    // publish latest info highlighted, override previous data
    logbox(
      "Block Time",
      infoString(...latest_data, true),
      new Date(latest_data[0].timestamp * 1000).toLocaleTimeString()
    );
    highlight_timeout.refresh();
  });

  sub.on("error", () => {
    clearTimeout(stale_timeout);
    clearTimeout(highlight_timeout);
  });
};

//
// process handlers
//
process.on("SIGWINCH", () => {
  logbox(...global_screen_params);
});

process.on("SIGINT", () => {
  process.stdout.write("\u001b[?25h");
  process.exit(2);
});
process.on("exit", () => {
  process.stdout.write("\u001b[?25h");
});
