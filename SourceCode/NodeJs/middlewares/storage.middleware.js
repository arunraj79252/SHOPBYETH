const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const awsConfig = require('../config/aws.config');
const aws = require('aws-sdk')
require('dotenv').config();
const fileFilter = (req, file, cb) => {

  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    return cb(null, true);
  } else {
    return cb(new Error('Invalid file type'));
  }
};
let accessKeyId = process.env.accessKeyId
let secretAccessKey = process.env.secretAccessKey
let server = undefined
if (awsConfig.awsService === 'local') {
    accessKeyId = process.env.accessKeyIdLocal
    secretAccessKey = process.env.secretAccessKeyLocal
    server = process.env.s3LocalServer
}


let s3 = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  endpoint: server,
  sslEnabled: false,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});
const uploadStorage = multer({
  storage: multerS3({
    s3: s3,
    bucket: awsConfig.bucket,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      try {
        if (req.url.includes("feedback")) {
          cb(null, 'images/temp/feedbackImage_' + '-' + Date.now() + file.originalname);
        }
       else if (req.url.includes("homeImage")) {
          cb(null, 'images/temp/homeImage_' + '-' + Date.now() + file.originalname);
        }
        else {
          cb(null, 'images/temp/productImage_' + '-' + Date.now() + file.originalname);
        }
      } catch (error) {
        console.error("ERROR : ", error)
      }
    },
  }), fileFilter: fileFilter,

});
module.exports = uploadStorage;