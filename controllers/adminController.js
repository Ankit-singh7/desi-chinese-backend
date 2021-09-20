
const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const passwordLib = require('./../libs/generatePasswordLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const token = require('../libs/tokenLib')
const AuthModel = mongoose.model('Auth')

const emailLib = require('../libs/emailLib');

/* Models */
const adminModel = mongoose.model('Admin')

const applicationUrl = 'http://trego.tk' //url of frontend application

/* Get all user Details */
let getAllUser = (req, res) => {
    adminModel.find()
        .select(' -__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getAllUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller: getAllUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get all users

 

/* Get single user details */
/* params : userId
*/
let getSingleUser = (req, res) => {
    UserModel.findOne({ 'adminId': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getSingleUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller:getSingleUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single user


/* Delete user */
/* params : userId
*/

let deleteUser = (req, res) => {

    UserModel.findOneAndRemove({ 'userId': req.params.userId })
    .select('-password -_id -__v -email -validationToken')
    .exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: deleteUser', 10)
            let apiResponse = response.generate(true, 'Failed To delete user', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: deleteUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Deleted the user successfully', 200, result)
            res.send(apiResponse)
        }
    });// end user model find and remove


}// end delete user

/* Edit user details */
/* params : userId
   body : firstName,lastName,mobileNumber 
*/

let editUser = (req, res) => {

    let options = req.body;
    UserModel.update({ 'userId': req.params.id }, options).exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller:editUser', 10)
            let apiResponse = response.generate(true, 'Failed To edit user details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: editUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'User details Updated', 200, "None")
            res.send(apiResponse)
        }
    });// end user model update


}// end edit user

/* Verify Email  */
/* params : userId
*/
/*
let verifyEmailFunction = (req, res) => {
    let findUser = () => {
        //console.log("findUser");
        return new Promise((resolve, reject) => {
            if (req.body.userId) {
                console.log("req body userId is there");
                //console.log(req.body);
                UserModel.findOne({ 'userId': req.body.userId })
                .select('-password -__v -_id')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'User Controller: getSingleUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        logger.info('No User Found', 'User Controller:getSingleUser')
                        let apiResponse = response.generate(true, 'No User Found', 404, null)
                        reject(apiResponse)
                    } else {
                        let apiResponse = response.generate(false, 'User Details Found', 200, result)
                        resolve(result)
                    }
                })
        
            } else {
                let apiResponse = response.generate(true, '"userId" parameter is missing', 400, null)
                reject(apiResponse)
            }
        })
    }

    let verifyEmail = (retrievedUserDetails) => {
        //console.log("verifyEmail");
        return new Promise((resolve, reject) => {
            UserModel.updateOne({ 'userId': retrievedUserDetails.userId }, {'emailVerified': 'Yes'}).exec((err, result) => {
                if (err) {
                    //console.log("Error in verifying" + err)
                    logger.error(err.message, 'User Controller:verifyEmail', 10)
                    let apiResponse = response.generate(true, 'Failed To verify email', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(result)) {
                    logger.info('No User Found', 'User Controller: verifyEmail')
                    let apiResponse = response.generate(true, 'No User Found', 404, null)
                    reject(apiResponse)
                } else {
                    let apiResponse = response.generate(false, 'User email Verified', 200, result)
                    resolve(result)
                }
            });// end user model update
        })
    }


    findUser(req, res)
        .then(verifyEmail)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'User email Verified', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}
*/

// start user signup function 
/* params : firstname,lastName,email,mobileNumber,password
*/

let signUpFunction = (req, res) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, 'Email Does not met the requirement', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, '"password" parameter is missing"', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(req)
                }
            } else {
                logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
                let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
                reject(apiResponse)
            }
        })
    }// end validate user input

    let createUser = () => { 
        return new Promise((resolve, reject) => {
            adminModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body)
                        let newUser = new adminModel({
                            adminId: customId({
                                randomLength: 2
                            }),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || '',
                            email: req.body.email.toLowerCase(),
                            password: req.body.password,
                            status:req.body.status,
                            role:req.body.role,
                            createdOn: time.now()
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                              

                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                        reject(apiResponse)
                    }
                })
        })
    }// end create user function


    validateUserInput(req, res)
        .then(createUser)
        .then((resolve) => {
            delete resolve.password
            delete resolve._id
            delete resolve.__v
            let apiResponse = response.generate(false, 'User created', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })

}// end user signup function 

// start of login function 
/* params : email,password
*/

let loginFunction = (req, res) => {
    let findUser = () => {
        //console.log("findUser");
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                console.log("req body email is there");
                //console.log(req.body);
                adminModel.findOne({email: req.body.email}, (err, userDetails) => {
                    /* handle the error here if the User is not found */
                    if (err) {
                        console.log(err)
                        logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
                        /* generate the error message and the api response message here */
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                        /* if Company Details is not found */
                    } else if (check.isEmpty(userDetails)) {
                        /* generate the response and the console error message here */
                        logger.error('No User Found', 'userController: findUser()', 7)
                        let apiResponse = response.generate(true, 'No User Found with this email', 404, null)
                        reject(apiResponse)
                    } else {
                        /* prepare the message and the api response here */
                        logger.info('User Found', 'userController: findUser()', 10)
                        resolve(userDetails)
                    }
                });

            } else {
                let apiResponse = response.generate(true, '"email" parameter is missing', 400, null)
                reject(apiResponse)
            }
        })
    }

    let validatePassword = (retrievedUserDetails) => {
        console.log(retrievedUserDetails)
        console.log("validatePassword");
        return new Promise((resolve, reject) => {
            if(req.body.password === retrievedUserDetails.password) {
                resolve(retrievedUserDetails)
            } else {
                logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10)
                let apiResponse = response.generate(true, 'Invalid password', 400, null)
                reject(apiResponse)
            }
        })
    }



    findUser(req, res)
        .then(validatePassword)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}



// end of the login function 


/**
 * function to logout user.
 * auth params: userId.
 */
let logout = (req, res) => {
    AuthModel.findOneAndRemove({ userId: req.params.userId }, (err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'user Controller: logout', 10)
            let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'Already Logged Out or Invalid UserId', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Logged Out Successfully', 200, null)
            res.send(apiResponse)
        }
    })
} // end of the logout function.


/* Function to generate recoveryPassword and sending recoveryPassword via email */
/* params : email
*/

// let resetPasswordFunction = (req, res) => {
//     //finding user with email
//     let findUser = () => {
//         console.log("findUser");
//         return new Promise((resolve, reject) => {
//             if (req.body.email) {
//                 console.log("req body email is there");
//                 console.log(req.body);
//                 UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
//                     /* handle the error here if the User is not found */
//                     if (err) {
//                         console.log(err)
//                         logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
//                         /* generate the error message and the api response message here */
//                         let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
//                         reject(apiResponse)
//                         /* if Company Details is not found */
//                     } else if (check.isEmpty(userDetails)) {
//                         /* generate the response and the console error message here */
//                         logger.error('No User Found', 'userController: findUser()', 7)
//                         let apiResponse = response.generate(true, 'No User Details Found', 404, null)
//                         reject(apiResponse)
//                     } else {
//                         /* prepare the message and the api response here */
//                         logger.info('User Found', 'userController: findUser()', 10)
//                         resolve(userDetails)
//                     }
//                 });

//             } else {
//                 let apiResponse = response.generate(true, '"email" parameter is missing', 400, null)
//                 reject(apiResponse)
//             }
//         })
//     }
//     //reset password
//     let generateToken = (userDetails) => {
//         console.log("generate token");
//         return new Promise((resolve, reject) => {
//             token.generateToken(userDetails, (err, tokenDetails) => {
//                 if (err) {
//                     console.log(err)
//                     let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
//                     reject(apiResponse)
//                 } else {
//                     tokenDetails.userId = userDetails.userId
//                     tokenDetails.userDetails = userDetails
//                     resolve(tokenDetails)
//                 }
//             })
//         })
//     }

//     let resetPassword = (tokenDetails) =>{
//         return new Promise((resolve, reject) => {

//             let options = {
//                 validationToken: tokenDetails.token
//             }
    
//             UserModel.update({ 'email': req.body.email }, options).exec((err, result) => {
//                 if (err) {
//                     console.log(err)
//                     logger.error(err.message, 'User Controller:resetPasswordFunction', 10)
//                     let apiResponse = response.generate(true, 'Failed To reset user Password', 500, null)
//                     reject(apiResponse)
//                 }  else {
    
//                     //let apiResponse = response.generate(false, 'Password reset successfully', 200, result)
//                     resolve(result)
//                     //Creating object for sending welcome email
//                     console.log(tokenDetails)
//                     let sendEmailOptions = {
//                         email: tokenDetails.userDetails.email,
//                         subject: 'Reset Password for Trego ',
//                         html: `<h4> Hi ${tokenDetails.userDetails.firstName}</h4>
//                             <p>
//                                 We got a request to reset your password associated with this ${tokenDetails.userDetails.email} . <br>
//                                 <br>Please use following link to reset your password. <br>
//                                 <br> <a href="${applicationUrl}/Reset-Pass/${options.validationToken}">Click Here</a>                                 
//                             </p>
    
//                             <br><b>Trego</b>
//                                         `
//                     }
    
//                     setTimeout(() => {
//                         emailLib.sendEmail(sendEmailOptions);
//                     }, 2000);
    
//                 }
//             });// end user model update
    
//         });//end promise
    
//     }//end reset password

//     //making promise call
//     findUser(req, res)
//         .then(generateToken)
//         .then(resetPassword)
//         .then((resolve) => {
//             let apiResponse = response.generate(false, 'Password reset instructions sent successfully', 200, 'None')
//             res.status(200)
//             res.send(apiResponse)
//         })
//         .catch((err) => {
//             console.log("errorhandler");
//             console.log(err);
//             res.status(err.status)
//             res.send(err)
//         })


// }// end resetPasswordFunction

/* Function to update password and sending email */
/* params : recoveryPassword,paswword
*/

// let updatePasswordFunction = (req, res) => {

//     let findUser = () => {
//         console.log("findUser");
//         return new Promise((resolve, reject) => {
//             if (req.body.validationToken) {
//                 console.log("req body validationToken is there");
//                 console.log(req.body);
//                 UserModel.findOne({ validationToken: req.body.validationToken }, (err, userDetails) => {
//                     /* handle the error here if the User is not found */
//                     if (err) {
//                         console.log(err)
//                         logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
//                         /* generate the error message and the api response message here */
//                         let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
//                         reject(apiResponse)
//                         /* if Company Details is not found */
//                     } else if (check.isEmpty(userDetails)) {
//                         /* generate the response and the console error message here */
//                         logger.error('No User Found', 'userController: findUser()', 7)
//                         let apiResponse = response.generate(true, 'No User Details Found', 404, null)
//                         reject(apiResponse)
//                     } else {
//                         /* prepare the message and the api response here */
//                         logger.info('User Found', 'userController: findUser()', 10)
//                         resolve(userDetails)
//                     }
//                 });

//             } else {
//                 let apiResponse = response.generate(true, '"validationToken" parameter is missing', 400, null)
//                 reject(apiResponse)
//             }
//         })
//     }

//     let passwordUpdate = (userDetails) => {
//         return new Promise((resolve, reject) => {

//             let options = {
//                 password: passwordLib.hashpassword(req.body.password),
//                 validationToken:'Null'
//             }

//             UserModel.update({ 'userId': userDetails.userId }, options).exec((err, result) => {
//                 if (err) {
//                     console.log(err)
//                     logger.error(err.message, 'User Controller:updatePasswordFunction', 10)
//                     let apiResponse = response.generate(true, 'Failed To reset user Password', 500, null)
//                     reject(apiResponse)
//                 } else if (check.isEmpty(result)) {
//                     logger.info('No User Found with given Details', 'User Controller: updatePasswordFunction')
//                     let apiResponse = response.generate(true, 'No User Found', 404, null)
//                     reject(apiResponse)
//                 } else {


//                     let apiResponse = response.generate(false, 'Password Updated successfully', 200, result)
//                     resolve(result)
//                     //Creating object for sending welcome email

//                     let sendEmailOptions = {
//                         email: userDetails.email,
//                         subject: 'Password Updated for Trego ',
//                         html: `<h4> Hi ${userDetails.firstName}</h4>
//                         <p>
//                             Password updated successfully.
//                         </p>
//                         <h3> Thanks for using Trego </h3>
//                                     `
//                     }

//                     setTimeout(() => {
//                         emailLib.sendEmail(sendEmailOptions);
//                     }, 2000);


//                 }
//             });// end user model update
//         });
//     }//end passwordUpdate

//     findUser(req, res)
//         .then(passwordUpdate)
//         .then((resolve) => {
//             let apiResponse = response.generate(false, 'Password Update Successfully', 200, "None")
//             res.status(200)
//             res.send(apiResponse)
//         })
//         .catch((err) => {
//             console.log("errorhandler");
//             console.log(err);
//             res.status(err.status)
//             res.send(err)
//         })


// }// end updatePasswordFunction


/* Function to change password and sending  email */
/* params : userId,oldPassword,newPassword
*/
// let changePasswordFunction = (req, res) => {
//     //finding user
//     let findUser = () => {
//         console.log("findUser");
//         return new Promise((resolve, reject) => {
//             if (req.body.userId != undefined && req.body.oldPassword != undefined) {
//                 console.log("req body userId and oldPassword is there");
//                 console.log(req.body);
//                 UserModel.findOne({ userId: req.body.userId }, (err, userDetails) => {
//                     /* handle the error here if the User is not found */
//                     if (err) {
//                         console.log(err)
//                         logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
//                         /* generate the error message and the api response message here */
//                         let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
//                         reject(apiResponse)
//                         /* if Company Details is not found */
//                     } else if (check.isEmpty(userDetails)) {
//                         /* generate the response and the console error message here */
//                         logger.error('No User Found', 'userController: findUser()', 7)
//                         let apiResponse = response.generate(true, 'No User Details Found', 404, null)
//                         reject(apiResponse)
//                     } else {
//                         /* prepare the message and the api response here */
//                         logger.info('User Found', 'userController: findUser()', 10)
//                         resolve(userDetails)
//                     }
//                 });

//             } else {
//                 let apiResponse = response.generate(true, '"userId" parameter is missing', 400, null)
//                 reject(apiResponse)
//             }
//         })
//     }

//     //validate old password with database 
//     let validatePassword = (retrievedUserDetails) => {
//         console.log("validatePassword");
//         console.log(retrievedUserDetails);
//         return new Promise((resolve, reject) => {
//             passwordLib.comparePassword(req.body.oldPassword, retrievedUserDetails.password, (err, isMatch) => {
//                 if (err) {
//                     console.log(err)
//                     logger.error(err.message, 'userController: validatePassword()', 10)
//                     let apiResponse = response.generate(true, 'Validate Password Failed', 500, null)
//                     reject(apiResponse)
//                 } else if (isMatch) {
//                     let retrievedUserDetailsObj = retrievedUserDetails.toObject()
//                     delete retrievedUserDetailsObj.password
//                     delete retrievedUserDetailsObj._id
//                     delete retrievedUserDetailsObj.__v
//                     delete retrievedUserDetailsObj.createdOn
//                     delete retrievedUserDetailsObj.modifiedOn
//                     resolve(retrievedUserDetailsObj)
//                 } else {
//                     logger.info('Update Failed Due To Invalid Password', 'userController: validatePassword()', 10)
//                     let apiResponse = response.generate(true, 'Wrong Password.', 400, null)
//                     reject(apiResponse)
//                 }
//             })
//         })
//     }

//     //password update 
//     let passwordUpdate = (userDetails) => {
//         return new Promise((resolve, reject) => {

//             let options = {
//                 password: passwordLib.hashpassword(req.body.newPassword),
//             }

//             UserModel.update({ 'userId': userDetails.userId }, options).exec((err, result) => {
//                 if (err) {
//                     console.log(err)
//                     logger.error(err.message, 'User Controller:updatePasswordFunction', 10)
//                     let apiResponse = response.generate(true, 'Failed To update user Password', 500, null)
//                     reject(apiResponse)
//                 } else if (check.isEmpty(result)) {
//                     logger.info('No User Found with given Details', 'User Controller: updatePasswordFunction')
//                     let apiResponse = response.generate(true, 'No User Found', 404, null)
//                     reject(apiResponse)
//                 } else {


//                     let apiResponse = response.generate(false, 'Password Updated successfully', 200, result)
//                     resolve(result)
//                     //Creating object for sending welcome email

//                     let sendEmailOptions = {
//                         email: userDetails.email,
//                         subject: 'Password Updated for Trego',
//                         html: `<h4> Hi ${userDetails.firstName}</h4>
//                         <p>
//                             Password updated successfully.
//                         </p>
//                         <h3> Thanks for using Trego </h3>
//                                     `
//                     }
//                     console.log(sendEmailOptions)
                    
//                     setTimeout(() => {
//                         emailLib.sendEmail(sendEmailOptions);
//                     }, 2000);


//                 }
//             });// end user model update
//         });
//     }//end passwordUpdate

//     //making promise call
//     findUser(req, res)
//         .then(validatePassword)
//         .then(passwordUpdate)
//         .then((resolve) => {
//             let apiResponse = response.generate(false, 'Password Updated Successfully', 200, "None")
//             res.status(200)
//             res.send(apiResponse)
//         })
//         .catch((err) => {
//             console.log("errorhandler");
//             console.log(err);
//             res.status(err.status)
//             res.send(err)
//         })


// }// end updatePasswordFunction



let resetPasswordFunction = (req,res) => {
    adminModel.find({'email':req.body.email})
    .select(' -__v -_id -password')
    .lean()
    .exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: getAllUser', 10)
            let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: getAllUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let options = {
                password: req.body.password
            }

            UserModel.update({'email':req.body.email},options)
            .select('-password')
            .exec((err,result) => {
                if(err) {
                    console.log(err)
                } else {

                    let apiResponse = response.generate(false, 'User Details Found', 200, result)
                    res.send(apiResponse)
                }
            })
        }
    })
}

let forgotPasswordFunction = (req,res) => {
    adminModel.find({'email':req.body.email})
    .select(' -__v -_id')
    .lean()
    .exec((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: getAllUser', 10)
            let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: getAllUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            console.log(result)
            console.log(req.body.oldPassword)
            if(req.body.oldPassword === result[0].password) {

                let options = {
                    password: req.body.newPassword
                }
    
                adminModel.updateOne({'email':req.body.email},options)
                .select('-password')
                .exec((err,result) => {
                    if(err) {
                        console.log(err)
                    } else {
    
                        let apiResponse = response.generate(false, 'User Details Found', 200, result)
                        res.send(apiResponse)
                    }
                })
            } else {
                let apiResponse = response.generate(true, 'Old Password is not correct', 500, null)
                res.send(apiResponse)
            }
        }
    })
}


module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,

    getSingleUser: getSingleUser,
    

    editUser: editUser,
    deleteUser: deleteUser,
    getAllUser:getAllUser,
    resetPasswordFunction:resetPasswordFunction,
    forgotPasswordFunction: forgotPasswordFunction
}// end exports