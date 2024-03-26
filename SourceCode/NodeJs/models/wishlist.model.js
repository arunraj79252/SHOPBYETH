const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;
module.exports = mongoose => {

    const schema = mongoose.Schema(
        {
            _id: String,
            products: [{ productId: Long, addDate: { type: Date, default: Date.now } }],
        },
        { timestamps: true }
    );
    schema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
    const wishlist = mongoose.model("wishlist", schema);
    return wishlist;
};
