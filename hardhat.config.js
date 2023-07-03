require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")

const RPC_URL = process.env.RPC_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepiola: {
            url: RPC_URL,
            accounts: [PRIVATE_KEY],
            gasPrice: 35000000000,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            //hardhat puts a default account
            chainId: 31337,
        },
    },
    // solidity: "0.8.18",
    solidity: {
        compilers: [
            { version: "0.8.18" },
            { version: "0.6.6" },
            { version: "0.6.0" },
            { version: "0.4.11" },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        // coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        users: {
            default: 1,
        },
    },
}
