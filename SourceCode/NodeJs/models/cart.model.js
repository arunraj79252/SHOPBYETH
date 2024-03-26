const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;
module.exports = mongoose => {

    const schema = mongoose.Schema(
        {
            _id: String,
            products: [{
                _id: Long,
                productQuantity: Number,
                addedDate: { type: Date, default: Date.now }
            }]
        },
        { timestamps: true }
    );

    const cart = mongoose.model("cart", schema);
    return cart;
};
