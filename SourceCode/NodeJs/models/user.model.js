const mongoosePaginate = require("mongoose-paginate-v2");
module.exports = mongoose => {
  const schema = mongoose.Schema(
    {
      _id: String,
      name: String,
      email: String,
      phoneNo: Number,
      address: [{
        _id: String,
        name: { type: String, default: null },
        mobile: { type: Number, default: null },
        pincode: { type: Number, default: null },
        state: { type: String, default: null },
        address: { type: String, default: null },
        locality: { type: String, default: null },
        city: { type: String, default: null },
        country: { type: String, default: null },
        label: { type: Number, default: 0 }, //0-Home,1-Work,2-Other
        primary: { type: Number, default: 0 } //1-primary,0-non-primary
      }],
      usertype: { type: Number, default: 2 },
      coinBalance: { type: Number, default: 0 },
      wishlistedProducts: Array,
      cartProducts: Array,
      status: { type: Number, default: 1 },   //1-Active 0-Inactive
      deviceToken: { type: String, default: '' },
    },
    { timestamps: true }
  );
  schema.plugin(mongoosePaginate)
  const user = mongoose.model("user", schema);
  return user;
};
