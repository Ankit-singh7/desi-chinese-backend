
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
const UserModel = mongoose.model('User')
const RestroUser  = mongoose.model('User');
const RestroAdmin = mongoose.model('Admin');  

const applicationUrl = 'http://trego.tk' //url of frontend application

/* Get all user Details */
let getAllUser = (req, res) => {
    const page = req.query.current_page
    const limit = req.query.per_page
    UserModel.find()
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
                const startIndex = (page - 1)*limit;
                const endIndex = page * limit
                let total = result.length;
                let empList = result.slice(startIndex,endIndex)
                let newResult = {total:total,result:empList}
                let apiResponse = response.generate(false, 'All User Details Found', 200, newResult)
                res.send(apiResponse)
            }
        })
}// end get all users

 

/* Get single user details */
/* params : userId
*/
let getSingleUser = (req, res) => {
    UserModel.findOne({ 'userId': req.params.userId })
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
    UserModel.updateOne({ 'userId': req.params.userId }, options).exec((err, result) => {
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
            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body)
                        let newUser = new UserModel({
                            userId: customId({
                                randomLength: 2
                            }),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || '',
                            mobileNumber:req.body.mobileNumber,
                            email: req.body.email.toLowerCase(),
                            password: req.body.password,
                            status:req.body.status,
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
                UserModel.findOne({email: req.body.email}, (err, userDetails) => {
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

let resetPasswordFunction = (req,res) => {
    UserModel.find({'email':req.body.email})
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
    UserModel.find({'email':req.body.email})
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
    
                UserModel.updateOne({'email':req.body.email},options)
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


let sendEmail = (req,res) => {
    console.log(req.body)
    let sendEmail = () => {
        return new Promise((resolve, reject) => {
            
            let sendEmailOptions = {
               email: req.body.email,
               subject: `Query from a customer - ${req.body.subject}`,
               html: `<h4> Hi Admin,</h4>
                   <p> We got a query from <B>${req.body.name}</B> </p>
                       
                    <p>${req.body.message}</p>

                    <p>Contact No: - ${req.body.email}</p>                             
                   
       
                   <br><b>Love Desi Chinese</b>
                               `
           }
       
           setTimeout(() => {
               emailLib.sendEmail(sendEmailOptions);
           }, 2000);
           resolve('Message Sent Successfully')
        })
    }

    sendEmail(req, res)
    .then((resolve) => {
        let apiResponse = response.generate(false, 'Message Sent Successfully', 200, 'None')
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


// ✅ Normalize restro user → salon format
const normalizeSalonFormat = (user, role) => {
  return {
    // ✅ Map restro fields to salon field names
    user_id:     user.userId   || user.adminId || '',
    f_name:      user.firstName || '',
    l_name:      user.lastName  || '',
    email:       user.email     || '',
    phone:       user.mobileNumber || '',
    role:        role.toLowerCase(),
    status:      user.status    || 'Active',
    branch_id:   user.branchId  || user.branch_id  || '',
    branch_name: user.branchName || user.branch_name || '',
    designation: user.designation || '',
    shift:       user.shift     || '',
    salary:      user.salary    || null,
    authToken:   ''
  };
};

const loginFunctionForShiftly = (req, res) => {

  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).send(
      response.generate(true, 'Email, password and role are required', 400, null)
    );
  }

  const normalizedRole = role.toLowerCase();

  // ✅ Decide which collection to query
  const findUser = () => {
    return new Promise((resolve, reject) => {

      if (normalizedRole === 'employee') {
        // ✅ Employee — search in users collection
        RestroUser.findOne({ email, status: 'Active' }, (err, user) => {
          if (err)   return reject(response.generate(true, 'Failed to find user', 500, null));
          if (!user) return reject(response.generate(true, 'No employee found with this email', 404, null));
          resolve({ user, collection: 'users' });
        });

      } else if (normalizedRole === 'admin' || normalizedRole === 'operator') {
        // ✅ Admin/Operator — search in admins collection by role
        RestroAdmin.findOne({ email, role: normalizedRole }, (err, admin) => {
          if (err)    return reject(response.generate(true, 'Failed to find user', 500, null));
          if (!admin) return reject(response.generate(true, `No ${role} found with this email`, 404, null));
          resolve({ user: admin, collection: 'admins' });
        });

      } else {
        reject(response.generate(true, 'Invalid role', 400, null));
      }
    });
  };

  const validatePassword = ({ user, collection }) => {
    return new Promise((resolve, reject) => {
      if (password === user.password) {
        resolve({ user, collection });
      } else {
        reject(response.generate(true, 'Invalid password', 400, null));
      }
    });
  };

  findUser()
    .then(validatePassword)
    .then(({ user, collection }) => {


      // ✅ Normalize to salon format
      const normalizedUser = normalizeSalonFormat(user, normalizedRole);

      res.status(200).send(
        response.generate(false, 'Login Successful', 200, normalizedUser)
      );
    })
    .catch((err) => {
      res.status(err.status || 500).send(err);
    });
};



module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,

    getSingleUser: getSingleUser,
    

    editUser: editUser,
    deleteUser: deleteUser,
    getAllUser:getAllUser,
    resetPasswordFunction:resetPasswordFunction,
    forgotPasswordFunction: forgotPasswordFunction,
    sendEmail: sendEmail,
    loginFunctionForShiftly: loginFunctionForShiftly
}// end exports