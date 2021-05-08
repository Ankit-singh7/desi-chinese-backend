const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */

const ingredientReportModel = mongoose.model('ingredientReport');



let getAllIngredientReport = (req, res) => {
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
                let apiResponse = response.generate(false, 'All Ingredients Found', 200, result)
                res.send(apiResponse)
            }
        })
}

module.exports = {
    getAllIngredientReport:getAllIngredientReport
}