const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const branchModel = mongoose.model('branch');


let getAllBranch = (req,res) => {
    const filters = req.query;
    branchModel.find()
    .lean()
    .select('-__v -_id')
    .exec((err,result) => {
        if(err) {
            console.log(err)
            logger.error(err.message, 'Branch Controller: getAllBranch', 10)
            let apiResponse = response.generate(true, 'Failed To Find ', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            logger.info('No Data Found', 'Branch Controller: getAllBranch')
            let apiResponse = response.generate(true, 'No Data Found', 404, null)
            res.send(apiResponse)
        }  else {
            const filteredUsers = result.filter(user => {
                console.log('here', user)
                let isValid = true;
                for (key in filters) {
                    console.log(filters[key])
                    console.log('here', user[key])
           
                        isValid = isValid && user[key] == filters[key];
                    

                }
                return isValid;
            });
            let sortResult = filteredUsers.sort(function(a,b) {
                return a.branch_name.localeCompare(b.branch_name); //using String.prototype.localCompare()
            })
            let apiResponse = response.generate(false, 'All Branch Found', 200, sortResult)
            res.send(apiResponse)
        }
    })
}



/* Get single category details */
/* params : Id
*/
let getSingleBranchDetail = (req, res) => {
    branchModel.findOne({ 'branch_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Branch Controller: getSingleBranchDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'Branch Controller: getSingleBranchDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category


let createBranch = (req,res) => {
    console.log(req.body)
    let newCategory = new branchModel({
        branch_id: shortid.generate(),
        branch_name: req.body.name,
        branch_address: req.body.address,
        branch_phone: req.body.phone,
        branch_start_timing: req.body.branch_start_timing,
        branch_end_timing: req.body.branch_end_timing,
        branch_gst: req.body.branch_gst,
        footer_1: req.body.footer_1,
        footer_2: req.body.footer_2,
        footer_3: req.body.footer_3,
        google_link: req.body.google_link,
        facebook_link: req.body.facebook_link,
        createdOn: time.now()
    })

    newCategory.save((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Branch Controller: createBranch', 10)
            let apiResponse = response.generate(true, 'Failed To create new Branch', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Branch Successfully created', 200, result)
            res.send(apiResponse)
        }
    })
}


let deleteBranch = (req,res) => {
    branchModel.findOneAndRemove({'branch_id':req.params.id})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Branch Controller: deleteBranch', 10)
            let apiResponse = response.generate(true, 'Failed To delete Branch', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Branch Found', 'Branch Controller: deleteBranch')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Branch Successfully deleted', 200, result)
            res.send(apiResponse)
        }
    })
}


let updateBranch = (req,res) => {
    let option = req.body
    branchModel.updateOne({'branch_id':req.params.id},option,{multi:true})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Branch Controller: branch', 10)
            let apiResponse = response.generate(true, 'Failed To update branch', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Branch Found', 'Branch Controller: branch')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Branch Successfully updated', 200, result)
            res.send(apiResponse)
        }
    })
}




module.exports = {
    getAllBranch:getAllBranch,
    getSingleBranchDetail:getSingleBranchDetail,
    createBranch:createBranch,
    deleteBranch: deleteBranch,
    updateBranch:updateBranch
}