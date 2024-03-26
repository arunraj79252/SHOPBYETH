module.exports = {

// const logger = require("../../lib/logger").getLogger();
 sendMail(userEmail,response){
    const nodemailer = require('nodemailer');

    // logger.info("inside send mail")
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        // service: 'gmail',
        auth: {
            user: 'suchitra.nair59@gmail.com',
            pass: 'fauhkaqwuvetbwny'
        }
      });
      
      var mailOptions = {
        from: 'suchitra.nair59@gmail.com',
        to: 'suths.nair27@gmail.com',
        subject: 'Sending Email using Node.js',
        text: response
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log("Error in send mail " + error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
 
}

}
