'use strict';

const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')


let sendEmail = (sendEmailOptions) => {

    

    let transporter = nodemailer.createTransport(smtpTransport({
        service: "Outlook365",
        host: "smtp.office365.com",
        port: "587",
        tls: {
         ciphers: "SSLv3",
         rejectUnauthorized: false,
        },
        auth: {
            user:'Ankit.as2307@outlook.com', 
            pass: 'Ankit$ingh7'
        }
    }));

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'Ankit.as2307@outlook.com', // sender address
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
