const mongoosePaginate = require("mongoose-paginate-v2");
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;

module.exports = mongoose => {
    // var SchemaTypes = mongoose.Schema.Types
    const schema = mongoose.Schema(
        {
            _id: Long,
            productName: { type: String, default: "" },
            description: { type: String, default: "" },
            categoryId: { type: String, default: "" },
            subCategoryId: { type: String, default: "" },
            brandId: { type: String, default: "" },
            typeId: { type: String, default: "" },
            price: { type: Number, default: 0 },
            originalPrice: { type: Number, default: 0 },
            availableStock: { type: Number, default: 0 },
            coverImage: { type: String, default: "" },
            productImages: { type: Array, default: [] },
            viewCount: { type: Number, default: 0 },
            saleCount: { type: Number, default: 0 },
            gender: { type: Number, default: 0 },   //0-unisex 1-male 2-female 3-boy 4-girl 5-kids unisex
            specifications: { type: Object, default: {} },
            feedback: [{ _id: String, userId: String, rating: Number, reviewTitle: String, review: String, helpfulCount: { type: Number, default: 0 },feedbackImages: { type: Array, default: [] }, edited: { type: Number, default: 0 }, date: { type: Date, default: Date.now } }],
            returnPeriod: { type: Number, default: 7 }, //return period in number of days
            deleted: { type: Number, default: 0 }  //1 = deleted
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
    const product = mongoose.model("product", schema);
    return product;
};
