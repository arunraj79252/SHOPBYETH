const orderStatus = require("../utils/order-status.utils");
const paymentStatus = require("../utils/payment-status.utils");
const rewardStatus = require("../utils/reward-status.utils");
const mongoosePaginate = require("mongoose-paginate-v2");
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;

module.exports = mongoose => {

  const schema = mongoose.Schema(
    {
      _id: Long,
      userId: String,
      products: [{
        _id: Long, productQuantity: Number,
        amount: { type: Number, default: 0 },
        returnStatus: { type: Number, default: 0 }, //0 = returnPeriod Not over, 1 = returnPeriod Over 2 = returned
        returnDate: { type: Date, default: null },
        orderStatus: { type: Number, default: orderStatus.waitingForPaymentConfirmation },
        refundTxHash: { type: String, default: "" },
        refundAmount: { ethereum: { type: String, default: "" }, rewardCoin: { type: String, default: "" } },
        statusLog: [{ _id: String, orderStatus: Number, user: { type: String, default: "Server" }, logDate: { type: Date, default: Date.now } }],
        addedDate: { type: Date, default: Date.now }
      }],
      total: { type: Number, default: 0 },
      totalEthereumPaid: { type: String, default: "0" },
      discount: { type: Number, default: 0 }, //total discount
      coinsEarned: { type: Number, default: 0 },
      totalRewardableAmount: { type: Number, default: 0 },
      paymentStatus: { type: Number, default: paymentStatus.waitingForPayment },
      paymentTxHash: { type: String, default: "" },
      rewardStatus: { type: Number, default: 0 },
      rewardTxHash: { type: String, default: "" },
      deliveryAddress: Object,
      finalPrice: Number,
      expiry: { type: Date, default: null },
      refundEthereumUsed: { type: String, default: "" },
      refundCoinsUsed: { type: Number, default: 0 }
    },
    { timestamps: true }
  );
  schema.plugin(mongoosePaginate)
  schema.plugin(mongooseAggregatePaginate)
  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });
  const orders = mongoose.model("orders", schema);
  return orders;
};