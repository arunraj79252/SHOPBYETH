const mongoosePaginate = require("mongoose-paginate-v2");
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
module.exports = mongoose => {

    const schema = mongoose.Schema(
        {
            _id: String,
            name: String,
        },
        { timestamps: true }
    );
    schema.plugin(mongoosePaginate)
    schema.plugin(mongooseAggregatePaginate)
    const category = mongoose.model("category", schema);
    return category;
};
