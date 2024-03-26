const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;
module.exports = mongoose => {

    const schema = mongoose.Schema(
        {
            _id:Long,
            orderId: Long,
            productId:Long,
            userId:String,
            message:[{response:String,userType:{ type: Number, default: 0 },addedDate: { type: Date, default: Date.now } }],//0-user 1-admin
            replyStatus:{ type: Number, default: 0 },//0---not replied, 1-replied
            mailStatus:{ type: Number, default: 0 }//0-not sent 1-sent
            

        },

        { timestamps: true }
    );

    const chatBot = mongoose.model("chatBot", schema);
    return chatBot;
};
