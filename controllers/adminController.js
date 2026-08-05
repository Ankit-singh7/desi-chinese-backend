
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
const adminService = require('../service/admin.service');

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
        return new Promise((resolve, reject) => {
            if (req.body.email) {
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

const getDashboard = async (req, res) => {
    try {

        const branchId = req.query.branch_id || '';

        const data = await adminService.getAdminDashboard(branchId);

        res.status(200).send({
            error: false,
            message: 'Admin dashboard fetched',
            data
        });

    } catch (err) {
        console.error(err);

        res.status(500).send({
            error: true,
            message: err.message || 'Failed to load dashboard'
        });
    }
};

const createEmployee = async (req, res) => {
    try {

        const data = req.body;
        const files = req.files;

        const user = await adminService.createEmployee(data, files);

        res.status(200).send({
            error: false,
            message: 'Employee created successfully',
            data: user
        });

    } catch (err) {
        console.error(err);

        res.status(500).send({
            error: true,
            message: err.message || 'Failed to create employee'
        });
    }
};

const adminOverwriteAttendance = async (req, res) => {
  try {

    const {
      employee_id,
      branch_id,
      date,
      sessions,
      admin_id
    } = req.body;

    if (!employee_id) {
      return res.status(400).send({
        error: true,
        message: 'employee_id is required'
      });
    }

    if (!date) {
      return res.status(400).send({
        error: true,
        message: 'date is required'
      });
    }

    const result = await adminService.adminOverwriteAttendance(
      employee_id,
      branch_id,
      admin_id,
      date,
      sessions || []
    );

    return res.status(200).send({
      error: false,
      message: result.message,
      data: result
    });

  } catch (err) {

    console.error('adminOverwriteAttendance:', err);

    return res.status(500).send({
      error: true,
      message: err.message || 'Failed to process attendance'
    });

  }
};

const saveIncentive = async (req, res) => {
  try {
    const result = await adminService.saveIncentive(req.body);
    res.status(200).send({ error: false, message: 'Incentive saved', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const getIncentiveList = async (req, res) => {
  try {
    const { month, branch_id, employee_id } = req.query;
    const result = await adminService.getIncentiveList(month, branch_id, employee_id);
    res.status(200).send({ error: false, message: 'Incentive list', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const removeIncentive = async (req, res) => {
  try {
    await adminService.removeIncentive(req.params.id);
    res.status(200).send({ error: false, message: 'Incentive removed', data: null });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const saveAdvance = async (req, res) => {
  try {
    const result = await adminService.saveAdvance(req.body);
    res.status(200).send({ error: false, message: 'Advance saved', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const getAdvanceList = async (req, res) => {
  try {
    const { month, branch_id, employee_id } = req.query;
    const result = await adminService.getAdvanceList(month, branch_id, employee_id);
    res.status(200).send({ error: false, message: 'Advance list', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const removeAdvance = async (req, res) => {
  try {
    await adminService.removeAdvance(req.params.id);
    res.status(200).send({ error: false, message: 'Advance removed', data: null });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const updateEmployeeSalaries = async (req, res) => {
  try {

    const { updates, admin_id } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).send({
        error: true,
        message: 'Invalid updates payload'
      });
    }

    const result = await adminService.updateEmployeeSalaries(updates, admin_id);

    res.status(200).send({
      error: false,
      message: 'Salaries updated successfully',
      data: result
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

const getEmployeeList = async (req, res) => {
  try {
    const data = await adminService.getEmployeeList();
    res.status(200).send({ error: false, message: 'Employee list', data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;
    const files = req.files;
    const User = mongoose.model('User');
    const Admin = mongoose.model('Admin');

    const updateData = {
      firstName:   data.f_name || data.firstName,
      lastName:    data.l_name || data.lastName,
      mobileNumber: data.phone || data.mobileNumber,
      email:       data.email,
      role:        data.role,
      designation: data.designation,
      branch_id:   data.branch_id,
      branch_name: data.branch_name,
      shift:       data.shift,
      salary:      data.salary !== undefined && data.salary !== '' ? Number(data.salary) : undefined,
      shift_time:  data.shift_time,
    };

    Object.keys(updateData).forEach(k => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    if (files?.aadhaar) {
      const { uploadToDrive } = require('../service/google-drive.service');
      updateData['documents.aadhaar_url'] = await uploadToDrive(
        files.aadhaar[0],
        process.env.GOOGLE_DRIVE_FOLDER_ID
      );
    }

    if (files?.pan) {
      const { uploadToDrive } = require('../service/google-drive.service');
      updateData['documents.pan_url'] = await uploadToDrive(
        files.pan[0],
        process.env.GOOGLE_DRIVE_FOLDER_ID
      );
    }

    // Restaurant: employees in User, operators in Admin
    const userResult = await User.updateOne({ userId }, { $set: updateData });
    if (userResult.matchedCount === 0) {
      // Keep operator role unless explicitly changed
      if (!updateData.role) {
        delete updateData.role;
      }
      await Admin.updateOne({ adminId: userId }, { $set: updateData });
    }

    res.status(200).send({
      error: false,
      message: 'Employee updated successfully',
      data: null
    });

  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getAdminActivity = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const result = await adminService.getAdminActivity(branch_id, 50);
    res.status(200).send({ error: false, message: 'Activity fetched', data: result });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const savePayrollAdjustment = async (req, res) => {
  try {
    const {
      employee_id,
      branch_id,
      month,
      paid_leave_days,
      festival_days,
      updated_by
    } = req.body;

    const data = await adminService.savePayrollAdjustment(
      employee_id,
      branch_id,
      month,
      Number(paid_leave_days || 0),
      Number(festival_days || 0),
      updated_by
    );

    res.status(200).send({
      error: false,
      message: 'Payroll adjustment saved successfully',
      data
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getEmployeePayrollPreview = async (req, res) => {
  try {
    const { employee_id, month } = req.query;
    const data = await adminService.getEmployeePayrollPreview(employee_id, month);
    res.status(200).send({
      error: false,
      message: 'Payroll preview fetched successfully',
      data
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const generateEmployeePayroll = async (req, res) => {
  try {
    const { employee_id, month, admin_id } = req.body;
    const data = await adminService.generateEmployeePayroll(employee_id, month, admin_id);
    res.status(200).send({
      error: false,
      message: 'Payroll generated successfully',
      data
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getPayrollEmployees = async (req, res) => {
  try {
    const { month, branch_id } = req.query;
    const data = await adminService.getPayrollEmployees(month, branch_id || '');
    res.status(200).send({
      error: false,
      message: 'Payroll employees fetched successfully',
      data
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const lockEmployeePayroll = async (req, res) => {
  try {
    const { employee_id, month, admin_id } = req.body;
    const data = await adminService.lockEmployeePayroll(employee_id, month, admin_id);
    res.status(200).send({
      error: false,
      message: 'Payroll locked successfully',
      data
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const markEmployeePayrollPaid = async (req, res) => {
  try {
    const { employee_id, month, admin_id } = req.body;
    const data = await adminService.markEmployeePayrollPaid(employee_id, month, admin_id);
    res.status(200).send({
      error: false,
      message: 'Payroll marked as paid successfully',
      data
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getEmployeePayroll = async (req, res) => {
  try {
    const payroll = await adminService.getEmployeePayroll(
      req.query.employee_id,
      req.query.month
    );
    return res.send({ error: false, message: 'Payroll fetched', data: payroll });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

const getEmployeePayrollSlip = async (req, res) => {
  try {
    const { employee_id, month } = req.query;
    const data = await adminService.getEmployeePayrollSlip(employee_id, month);
    return res.send({ error: false, message: 'Salary slip fetched', data });
  } catch (err) {
    return res.status(400).send({ error: true, message: err.message });
  }
};

const getAttendanceList = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const result = await adminService.getAttendanceList(employeeId, month, year);
    res.status(200).send({ error: false, data: result });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getFineList = async (req, res) => {
  try {
    const { month, employee_id } = req.query;
    const result = await adminService.getFineList(month, employee_id);
    res.status(200).send({ error: false, message: 'Fine list', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const saveFine = async (req, res) => {
  try {
    const result = await adminService.saveFine(req.body);
    res.status(200).send({ error: false, message: 'Fine saved', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const getEmployeeNotes = async (req, res) => {
  try {
    const { employee_id } = req.query;
    const result = await adminService.getEmployeeNotes(employee_id);
    res.status(200).send({ error: false, message: 'Employee notes', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const saveEmployeeNote = async (req, res) => {
  try {
    const result = await adminService.saveEmployeeNote(req.body);
    res.status(200).send({ error: false, message: 'Note saved', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const updateEmployeeNote = async (req, res) => {
  try {
    const result = await adminService.updateEmployeeNote(req.params.id, req.body);
    res.status(200).send({ error: false, message: 'Note updated', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
};

const deleteEmployeeNote = async (req, res) => {
  try {
    await adminService.deleteEmployeeNote(req.params.id);
    res.status(200).send({ error: false, message: 'Note deleted', data: null });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: true, message: err.message });
  }
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
    getDashboard,
    createEmployee,
    adminOverwriteAttendance,
    saveIncentive,
    getIncentiveList,
    removeIncentive,
    saveAdvance,
    getAdvanceList,
    removeAdvance,

    updateEmployeeSalaries,
    getEmployeeList,
    updateEmployee,
    getAdminActivity,

    savePayrollAdjustment,
    getEmployeePayrollPreview,
    generateEmployeePayroll,
    getPayrollEmployees,
    lockEmployeePayroll,
    markEmployeePayrollPaid,
    getEmployeePayroll,
    getEmployeePayrollSlip,
    getAttendanceList,
    getFineList,
    saveFine,
    getEmployeeNotes,
    saveEmployeeNote,
    updateEmployeeNote,
    deleteEmployeeNote
}// end exports