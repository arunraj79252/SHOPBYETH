const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;
module.exports = mongoose => {
    const schema = mongoose.Schema(
        {
            orderId: Long,
            publicAddress: Array,
            title: String,
            body: String,
            deviceToken: Array,
            status: { type: Number, default: 0 },//Read-1, Unread-0
            click_action: String

        },
        { timestamps: true }
    );
    schema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
    const notification = mongoose.model("notification", schema);
    return notification;
};
