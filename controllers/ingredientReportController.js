const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
const moment = require('moment')//npm install moment --save
/* Models */

const ingredientReportModel = mongoose.model('ingredientReport');



let getAllIngredientReport = (req, res) => {
    const page = req.query.current_page
    const limit = req.query.per_page
    const filters = req.query;
    delete filters.current_page
    delete filters.per_page
    console.log(filters)
    if(Object.keys(filters).length) {
        console.log('object')
        let formatted_sd = moment(filter.startDate,'DD-MM-YYYY')
        let formatted_ed = moment(filter.endDate,'DD-MM-YYYY').add(1,'day')
        console.log(formatted_sd.format())
        console.log(formatted_ed.format())

        ingredientReportModel.find({'date':{ $gte:formatted_sd.format(), $lte:formatted_ed.format()}}).exec((err,result) => {
            if(err) {
                res.send(err)
            } else if (check.isEmpty(result)) {
                let apiResponse = response.generate(false, 'Ingredient Successfuly found', 200, null)
                res.send(apiResponse)
    
            } else {
                const startIndex = (page - 1)*limit;
                const endIndex = page * limit
                let total = result.length;
                let reportList = result.slice(startIndex,endIndex)
                let newResult = {total:total,result:reportList}
                let apiResponse = response.generate(false, 'All Bills Found', 200, newResult)
                res.send(apiResponse)

            }
        })
    } else {
  console.log('here')
        ingredientReportModel.find()
            .lean()
            .select('-__v -_id')
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'Ingredient Controller: getAllIngredient', 10)
                    let apiResponse = response.generate(true, 'Failed To Find ', 500, null)
                    res.send(apiResponse)
                } else if (check.isEmpty(result)) {
                    logger.info('No Data Found', 'Ingredient Controller: getAllIngredient')
                    let apiResponse = response.generate(true, 'No Data Found', 404, null)
                    res.send(apiResponse)
                } else {
                    const startIndex = (page - 1)*limit;
                    const endIndex = page * limit
                    let total = result.length;
                    let reportList = result.slice(startIndex,endIndex)
                    let newResult = {total:total,result:reportList}
                    let apiResponse = response.generate(false, 'All Bills Found', 200, newResult)
                    res.send(apiResponse)
                }
            })
    }
}

let getIngredientReportByDate = (req,res) => {
    ingredientReportModel.find({'date': req.params.date},(err,result) => {
        if(err){
            res.send(err)
        } else if (check.isEmpty(result)) {
            res.send('Not found')

        } else {
            let apiResponse = response.generate(false, 'Ingredient Successfuly found', 200, result)
            res.send(apiResponse)
        }
    })
}





module.exports = {
    getAllIngredientReport:getAllIngredientReport,
    getIngredientReportByDate: getIngredientReportByDate
}