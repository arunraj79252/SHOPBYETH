const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const { Types: { Long } } = mongoose;
module.exports = mongoose => {

    const schema = mongoose.Schema(
        {
            _id:Long,
             imageType:String,
             homeImages: { type: Array, default: [] },
            },
            { timestamps: true }
          ); 
          const homeImage = mongoose.model("homeImage", schema);
          return homeImage;
      };
      