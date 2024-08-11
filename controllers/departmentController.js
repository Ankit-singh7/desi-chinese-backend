const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('../libs/timeLib');
const response = require('../libs/responseLib')
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const departmentModel = mongoose.model('department');


let getAllDepartment = (req,res) => {
    departmentModel.find()
    .lean()
    .select('-__v -_id')
    .exec((err,result) => {
        if(err) {
            let apiResponse = response.generate(true, 'Failed To Find ', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'No Data Found', 404, null)
            res.send(apiResponse)
        }  else {
            let apiResponse = response.generate(false, 'All Departments Found', 200, result)
            res.send(apiResponse)
        }
    })
}



/* Get single category details */
/* params : Id
*/
let getSingleDepartmentDetail = (req, res) => {
    departmentModel.findOne({ 'department_id': req.params.id })
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


let createDepartment = (req,res) => {
    console.log(req.body)
    let newCategory = new departmentModel({
        department_id: shortid.generate(),
        department_name: req.body.name,
        createdOn: time.now()
    })

    newCategory.save((err,result) => {
        if (err) {
            let apiResponse = response.generate(true, 'Failed To create new Department', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Department Successfully created', 200, result)
            res.send(apiResponse)
        }
    })
}


let deleteDepartment = (req,res) => {
    departmentModel.findOneAndRemove({'department_id':req.params.id})
    .exec((err,result) => {
        if (err) {
            let apiResponse = response.generate(true, 'Failed To delete Department', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Department Successfully deleted', 200, result)
            res.send(apiResponse)
        }
    })
}


let updateDepartment = (req,res) => {
    let option = req.body
    departmentModel.updateOne({'department_id':req.params.id},option,{multi:true})
    .exec((err,result) => {
        if (err) {
            let apiResponse = response.generate(true, 'Failed To update Department', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Department Successfully updated', 200, result)
            res.send(apiResponse)
        }
    })
}




module.exports = {
    getAllDepartment:getAllDepartment,
    getSingleDepartmentDetail:getSingleDepartmentDetail,
    createDepartment:createDepartment,
    deleteDepartment: deleteDepartment,
    updateDepartment:updateDepartment
}