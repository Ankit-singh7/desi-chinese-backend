const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
const moment = require('moment')//npm install moment --save
/* Models */

const salesReportModel = mongoose.model('salesReport');



let getAllSalesReport = (req, res) => {
    const filters = req.query;
    if(Object.keys(filters).length) {
        let formatted_sd = moment(req.query.startDate,'DD-MM-YYYY')
        let formatted_ed = moment(req.query.endDate,'DD-MM-YYYY').add(1,'day')
        salesReportModel.find({'date':{ $gte:formatted_sd.format(), $lte:formatted_ed.format()}}).exec((err,result) => {
            if(err) {
                res.send(err)
            } else if (check.isEmpty(result)) {
                let apiResponse = response.generate(false, 'Ingredient Successfuly found', 200, null)
                res.send(apiResponse)
    
            } else {
                // const startIndex = (page - 1)*limit;
                // const endIndex = page * limit
                // let total = result.length;
                // let reportList = result.slice(startIndex,endIndex)
                // let newResult = {total:total,result:reportList}
                let apiResponse = response.generate(false, 'All Bills Found', 200, result)
                res.send(apiResponse)

            }
        })
    } else {
          salesReportModel.find()
            .lean()
            .select('-__v -_id')
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'Sales Report Controller: getAllSalesReport', 10)
                    let apiResponse = response.generate(true, 'Failed To Find ', 500, null)
                    res.send(apiResponse)
                } else if (check.isEmpty(result)) {
                    logger.info('No Data Found', 'Ingredient Controller: getAllIngredient')
                    let apiResponse = response.generate(true, 'No Data Found', 404, null)
                    res.send(apiResponse)
                } else {
                    // const startIndex = (page - 1)*limit;
                    // const endIndex = page * limit
                    // let total = result.length;
                    // let reportList = result.slice(startIndex,endIndex)
                    // let newResult = {total:total,result:reportList}
                    let apiResponse = response.generate(false, 'All Sales Report Found', 200, result)
                    res.send(apiResponse)
                }
            })
    }
}



module.exports = {
    getAllSalesReport:getAllSalesReport
}