import { toast } from 'react-toastify';
import Web3 from 'web3';
const SBEToken = require('../contractAbi/SBEToken.json');
const { goerliContractAddress } = require('../contractAbi/ethereumConfig.js');

const makePayment = (amount, discount,orderId) => {
    return new Promise((resolve, reject) => {
        const web3Provider = new Web3(window.ethereum)
        const web3 = new Web3(web3Provider)
        const smartContract = new web3.eth.Contract(SBEToken.abi, goerliContractAddress)
        if (window.ethereum) {
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then(async (accounts) => {
                    let discountWei = Web3.utils.toWei(discount.toString(), "ether")
                    smartContract.methods.makePayment(discountWei,orderId).send({ from: accounts[0], value: Web3.utils.toWei(amount.toString(), "ether") })
                        .on('transactionHash', async function (hash) {
                            resolve(hash)
                        }).then(() => {
                            console.log("confirmed")
                        }).catch((error) => {
                            console.log(error);
                            resolve(-1)
                        })
                }).catch((error) => {
                    if (error.code === -32002) {
                        toast.error("Login is already requested! Please open metamask to cointinue")
                    }
                    resolve(-1)
                   
                    console.error("error", error);
                })
        }
    })
}

const getCoinBalance = () => {
    return new Promise((resolve, reject) => {
        const web3Provider = new Web3(window.ethereum)
        const web3 = new Web3(web3Provider)
        const smartContract = new web3.eth.Contract(SBEToken.abi, goerliContractAddress)
        if (window.ethereum) {
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then(async (accounts) => {
                    smartContract.methods.balanceOf(accounts[0]).call({ from: accounts[0] })
                        .then(coinBalance => {
                            let convertedCoinBalance = Web3.utils.fromWei(coinBalance.toString(), "ether")
                            resolve(convertedCoinBalance)
                        })
                })
        }
    })
}

const getEthereumBalance = () => {
    return new Promise((resolve, reject) => {
        const web3Provider = new Web3(window.ethereum)
        const web3 = new Web3(web3Provider)
        const smartContract = new web3.eth.Contract(SBEToken.abi, goerliContractAddress)
        if (window.ethereum) {
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then(async (accounts) => {
                    resolve(web3.eth.getBalance(accounts[0]))
                }).catch((error) => {
                    if (error.code === -32002) {
                        toast.error("Login is already requested! Please open metamask to cointinue")
                    }
                    resolve(-1)
                    
                  
                })
        }
    })
}
export { makePayment, getCoinBalance, getEthereumBalance };