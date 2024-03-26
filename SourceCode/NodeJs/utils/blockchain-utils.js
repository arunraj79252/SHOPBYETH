const ethereumConfig = require("../../Blockchain/config/ethereum.config");
const { refundCompleted } = require("./order-status.utils");
const db = require("../models");
const Orders = db.orders;
const User = db.user;
const Long = require('mongodb').Long
require('dotenv').config();
const Web3 = require('web3');
const MyTokenContractABI = require("../../Blockchain/ContractABIs/SBEToken.json");
const { updateRewardCoinSuccessStatus, updateOrderRefundSuccessStatus } = require("./orders.utils");
const errorCodeUtils = require("./error-code.utils");
const { logger } = require("./logger.utils");
const orderStatusUtils = require("./order-status.utils");
const goerliChainId = ethereumConfig.goerliChainId;
const Provider = require('@truffle/hdwallet-provider');
const SmartContractAddress = ethereumConfig.contractAddress
const SmartContractABI = MyTokenContractABI.abi;
const goerliNode = process.env.goerliNode;
const authorityAddress = process.env.authorityAddress
const privateKey = process.env.authorityPrivateKey
const provider = new Provider(privateKey, goerliNode);
const web3 = new Web3(provider);
const MyTokenContract = new web3.eth.Contract(SmartContractABI, SmartContractAddress);

exports.getTransactionStatus = (txnHash) => {
    return new Promise(async function (resolve, reject) {
        try {
            web3.eth.getTransactionReceipt(txnHash).then(receipt => {
                if (receipt !== null) {
                    if (receipt.status)
                        resolve(true)
                    else if (!receipt.status)
                        resolve(false)
                } else reject("No Receipt")
            }).catch(error => {
                console.error("Error while checking transaction status. Error: " + JSON.stringify(error))
                reject(error)
            });
        } catch (error) {
            console.error("Error while checking transaction status. Error: " + error)
            reject(error)
        }
    })
}

exports.mintCoin = async (orderId, to, amount) => {
    try {
        return new Promise((resolve, reject) => {
            const convertedAmount = Web3.utils.toWei(amount.toString(), "ether")
            MyTokenContract.methods.mint(to, convertedAmount).send({ from: authorityAddress })
                .on('transactionHash', async function (hash) {
                    resolve(hash);
                }).then((receipt) => {
                    if (receipt) {
                        logger.info(`Mint complete for order: ${orderId}`)
                        updateRewardCoinSuccessStatus(orderId, to, amount, receipt.status)
                    }
                }).catch((error) => {
                    console.error(`Error in mintCoin for orderId: ${orderId}.\n Error: ${JSON.stringify(error)}.`)
                    Orders.updateOne({ _id: Long.fromString(orderId.toString()) }, { $set: { rewardTxHash: "", rewardStatus: 0 } })
                    reject()
                })
        })
    }
    catch (error) {
        console.error(`Error caught in mint coin function. Error: ${error}`)
    }
}

exports.refundAmount = async (orderId, productId, to, amount, coinAmount) => {
    try {
        return new Promise((resolve, reject) => {
            // const convertedAmount = Web3.utils.toWei(amount.toString(), "ether");
            const convertedAmount = amount
            const convertedCoinAmount = coinAmount === '' ? 0 : Web3.utils.toWei(coinAmount.toString(), "ether");
            MyTokenContract.methods.refund(to, convertedCoinAmount, orderId.toString()).send({ from: authorityAddress, value: convertedAmount }) //add converted coin amount
                .on('transactionHash', async function (hash) {
                    resolve(hash);
                }).then(receipt => {
                    if (receipt) {
                        logger.info(`Refund successful for order: ${orderId}`)
                        updateOrderRefundSuccessStatus(orderId, productId, receipt.status, to, Number(coinAmount)).then().catch(error => {
                            console.log(error)
                        })
                    }
                }).catch((error) => {
                    console.error(`Error in refundAmount for orderId: ${orderId}.\n Error: ${error}.`)
                    Orders.updateOne({ _id: Long.fromString(orderId.toString()), 'products._id': productId }, {
                        $set: { 'products.$.refundTxHash': "", 'products.$.orderStatus': orderStatusUtils.refundFailed },
                        $push: {
                            'products.$.statusLog': [{
                                _id: 'SL' + orderStatusUtils.refundFailed + new Date().getTime().toString(),
                                orderStatus: orderStatusUtils.refundFailed,
                                user: "Server"
                            }]
                        }
                    }).then(() => reject()).catch(() => reject())
                })
        })
    }
    catch (error) {
        console.error(`Error caught in refund amount function. Error: ${error}`)
    }
}

exports.getCoinBalance = (walletAddress) => {
    return new Promise((resolve, reject) => {
        MyTokenContract.methods.balanceOf(walletAddress).call().then(balance => {
            let convertedCoinBalance = Web3.utils.fromWei(balance.toString(), "ether")
            resolve(convertedCoinBalance)
        }).catch(error => {
            console.error(`Error while fetching Coin Balance for User: ${walletAddress}. Error: ${error}`)
            reject(error)
        })
    })
}

exports.updateUserCoinBalance = (userId) => {
    return new Promise((resolve, reject) => {
        MyTokenContract.methods.balanceOf(userId).call().then(balance => {
            let convertedCoinBalance = Web3.utils.fromWei(balance.toString(), "ether")
            User.updateOne({ _id: userId }, { $set: { coinBalance: convertedCoinBalance } }).then(updateInfo => {
                if (updateInfo.modifiedCount === 1)
                    resolve(convertedCoinBalance)
                else
                    reject(`Error while updating Coin Balance for User: ${userId}. Error: ${error}`)
            }).catch(error => {
                console.error(`Error while updating Coin Balance for User: ${userId}. Error: ${error}`)
                reject(error)
            })
        }).catch(error => {
            console.error(`Error while fetching Coin Balance for User: ${userId}. Error: ${error}`)
            reject(error)
        })
    })
}

exports.validateTransactionHash = (txHash, userId) => {
    return new Promise(async (resolve, reject) => {
        await web3.eth.getTransaction(txHash).then(transaction => {
            if (transaction.to.toString().toLowerCase() === ethereumConfig.contractAddress.toLowerCase() && String(transaction.from).toLowerCase() === userId.toLowerCase()) {
                resolve()
            }
            else
                reject({ message: "Transaction Id Mismatch", errorCode: errorCodeUtils.TransactionHash_mismatch })
        }).catch(error => {
            console.error(`Error validation transaction hash: ${txHash} for user: ${userId}`)
            reject({ message: "Could not get transaction info.", errorCode: errorCodeUtils.Error_fetching_transaction_info })
        })
    })
}

exports.getOrderDetails = (orderId, userId, txHash) => {
    try {
        return new Promise(async (resolve, reject) => {
            try {
                web3.eth.getTransactionReceipt(txHash).then(transactionReceipt => {
                    MyTokenContract.getPastEvents('paymentEvent', {
                        fromBlock: transactionReceipt.blockNumber,
                        toBlock: transactionReceipt.blockNumber
                    }).then(events => {
                        let transaction = events.find(result => result.transactionHash === txHash)
                        if (transaction) {
                            let result = transaction.returnValues
                            if (orderId === result.orderId.toString() && userId === String(result.user).toLowerCase()) {
                                let orderDetails = {
                                    orderId: result.orderId.toString(),
                                    userId: result.user,
                                    totalEthereumPaid: result.amount,
                                    discount: web3.utils.fromWei(result._discount.toString(), "ether"),
                                }
                                resolve(orderDetails)
                            }
                            else {
                                reject("Transaction hash does not match with orderId / userId", errorCodeUtils.TransactionHash_mismatch)
                            }
                        }
                        else {
                            reject("No Transaction found for given transaction hash.", errorCodeUtils.TransactionHash_incorrect)
                        }
                    }).catch(error => {
                        console.error(`Error while fetching past events. Error: ${error}`)
                    })
                })
            }
            catch (error) {
                console.error(`Error while fetching past events. Error: ${error}`)
            }
        })
    }
    catch (error) {
        console.error(`Error while fetching past events. Error: ${error}`)
    }
}