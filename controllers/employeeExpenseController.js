const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('../libs/timeLib');
const response = require('../libs/responseLib')
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');
const moment = require('moment');
/* Models */
const employeeExpenseModel = mongoose.model('employeeExpense');


let getAllEmployeeExpense = (req, res) => {
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const filters = req.query;
    delete filters.startDate
    delete filters.endDate
        
        if(startDate && endDate) {
            let formatted_sd = moment(startDate,'DD-MM-YYYY')
            let formatted_ed = moment(endDate,'DD-MM-YYYY').add(1,'day')
            employeeExpenseModel.find({'createdOn':{ $gte:formatted_sd.format(), $lte:formatted_ed.format()}}).sort({ _id: -1 })
                .lean()
                .exec((err, result) => {
                    if (err) {
                        let apiResponse = response.generate(true, 'Failed To Find Employee Expense detail', 500, null)
                        res.send(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No Data Found', 404, null)
                        res.send(apiResponse)
                    } else {
                        const filteredUsers = result.filter(user => {
                            let isValid = true;
                            for (key in filters) {
                                if (key === 'createdOn') {
                                } else {
                                    isValid = isValid && user[key] == filters[key];
                                }
        
                            }
                            return isValid;
                        });
                        let newResult = { result: filteredUsers }
                        let apiResponse = response.generate(false, 'All Employee Expenses Found', 200, newResult)
                        res.send(apiResponse)
                    }
                })
        } else {
            employeeExpenseModel.find().sort({ _id: -1 })
                .lean()
                .exec((err, result) => {
                    if (err) {
                        let apiResponse = response.generate(true, 'Failed To Find Employee expense', 500, null)
                        res.send(apiResponse)
                    } else if (check.isEmpty(result)) {
                        logger.info('No Data Found', 'Employee Expense Controller: getAllEmployeeExpense')
                        let apiResponse = response.generate(true, 'No Data Found', 404, null)
                        res.send(apiResponse)
                    } else {
                        const filteredUsers = result.filter(user => {
                            let isValid = true;
                            for (key in filters) {
                                if (key === 'createdOn') {
        
                                    isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                                } else {
                                    isValid = isValid && user[key] == filters[key];
                                }
        
                            }
                            return isValid;
                        });
                  
                        let newResult = { total: total, result: filteredUsers }
                        let apiResponse = response.generate(false, 'All Employee expenses Found', 200, newResult)
                        res.send(apiResponse)
                    }
                })
        }
}



/* Get employee expense detail */
/* params : Id
*/
let getExpenseDetailById = (req, res) => {
    employeeExpenseModel.findOne({ 'expense_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category

let getExpenseDetailByEmployeeIdAndDate = (req, res) => {
    // Extract employee_id and createdOn date from request parameters or query
    const { id, createdOn } = req.params;
    console.log(id);
    console.log(createdOn)
    // Validate input
    if (!id || !createdOn) {
      let apiResponse = response.generate(true, 'Missing employee_id or createdOn date', 400, null);
      return res.send(apiResponse);
    }
  
    // Search for matching document
    employeeExpenseModel
      .findOne({ employee_id: id, createdOn: createdOn })
      .select('-__v -_id') // Exclude __v and _id fields from the result
      .lean()
      .exec((err, result) => {
        if (err) {
          // Handle query error
          let apiResponse = response.generate(true, 'Failed To Find Details', 500, null);
          return res.send(apiResponse);
        } else if (check.isEmpty(result)) {
          // Handle no results found
          let apiResponse = response.generate(true, 'No Detail Found', 404, null);
          return res.send(apiResponse);
        } else {
          // Return success response with the result
          let apiResponse = response.generate(false, 'Detail Found', 200, result);
          return res.send(apiResponse);
        }
      });
  };
  


let createEmployeeExpense = (req,res) => {
    const today = new Date();

    // Truncate the time part (set hours, minutes, seconds, and ms to 0)
    const truncatedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let newCategory = new employeeExpenseModel({
        expense_id: shortid.generate(),
        employee_id: req.body.employee_id,
        employee_name: req.body.employee_name,
        expenses: req.body.expenses,
        createdOn: truncatedDate
    })

    newCategory.save((err,result) => {
        if (err) {
            let apiResponse = response.generate(true, 'Failed To create new employee expense', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'employee expense Successfully created', 200, result)
            res.send(apiResponse)
        }
    })
}


let deleteEmployeeExpense = (req,res) => {
    employeeExpenseModel.findOneAndRemove({'expense_id':req.params.id})
    .exec((err,result) => {
        if (err) {
            let apiResponse = response.generate(true, 'Failed To delete expense', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'expense Successfully deleted', 200, result)
            res.send(apiResponse)
        }
    })
}


let updateEmployeeExpense = (req,res) => {
    let option = req.body
    employeeExpenseModel.updateOne({'expense_id':req.params.id},option,{multi:true})
    .exec((err,result) => {
        if (err) {
            let apiResponse = response.generate(true, 'Failed To update branch', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Branch Successfully updated', 200, result)
            res.send(apiResponse)
        }
    })
}




module.exports = {
    getAllEmployeeExpense:getAllEmployeeExpense,
    getExpenseDetailById:getExpenseDetailById,
    createEmployeeExpense:createEmployeeExpense,
    deleteEmployeeExpense: deleteEmployeeExpense,
    updateEmployeeExpense: updateEmployeeExpense,
    getExpenseDetailByEmployeeIdAndDate: getExpenseDetailByEmployeeIdAndDate
}