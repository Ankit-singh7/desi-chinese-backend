'use strict';

const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')


let sendEmail = (sendEmailOptions) => {

    

    let transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com', 
        auth: {
            user:'Ankit.as2307@gmail.com', 
            pass: 'Encyclopedia2#'
        }
    }));

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'Ankit.as2307@gmail.com', // sender address
        to: 'jifog38177@procowork.com', // list of receivers
        subject: sendEmailOptions.subject, // Subject line
        html: sendEmailOptions.html // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        else{
            console.log('Message successfully sent.', info);
            
        }
       
    });

}

module.exports = {
    sendEmail: sendEmail
  }
