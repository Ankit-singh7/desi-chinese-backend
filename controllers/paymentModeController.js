const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('../libs/timeLib');
const response = require('../libs/responseLib')
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const paymentModel = mongoose.model('paymentMode');



let getAllMode = (req,res) => {
    paymentModel.find()
    .lean()
    .select('-__v -_id')
    .exec((err,result) => {
        if(err) {
            console.log(err)
            logger.error(err.message, 'Ingredient Controller: getAllIngredient', 10)
            let apiResponse = response.generate(true, 'Failed To Find ', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            logger.info('No Data Found', 'Ingredient Controller: getAllIngredient')
            let apiResponse = response.generate(true, 'No Data Found', 404, null)
            res.send(apiResponse)
        }  else {
            let apiResponse = response.generate(false, 'All Payment Mode Found', 200, result)
            res.send(apiResponse)
        }
    })
}



/* Get single category details */
/* params : Id
*/
let getSingleModeDetail = (req, res) => {
    paymentModel.findOne({ 'payment_mode_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Ingredient Controller: getSingleIngredientDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'Ingredient Controller: getSingleIngredientDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category


let createMode = (req,res) => {
    console.log(req.body)
    let newCategory = new paymentModel({
        payment_mode_id: shortid.generate(),
        payment_mode_name: req.body.name,
    })

    newCategory.save((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Ingredient Controller: createIngredient', 10)
            let apiResponse = response.generate(true, 'Failed To create new Ingredient', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'ingredient Successfully created', 200, result)
            res.send(apiResponse)
        }
    })
}


let deleteMode = (req,res) => {
    paymentModel.findOneAndRemove({'payment_mode_id':req.params.id})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Ingredient Controller: deleteIngredient', 10)
            let apiResponse = response.generate(true, 'Failed To delete Ingredient', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Category Found', 'Ingredient Controller: deleteIngredient')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Food Category Successfully deleted', 200, result)
            res.send(apiResponse)
        }
    })
}


let updateMode = (req,res) => {
    let option = req.body
    paymentModel.updateOne({'payment_mode_id':req.params.id},option,{multi:true})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'FoodCategory Controller: updateCatergory', 10)
            let apiResponse = response.generate(true, 'Failed To delete food category', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Category Found', 'FoodCategory Controller: updateCategory')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Food Category Successfully updated', 200, result)
            res.send(apiResponse)
        }
    })
}




module.exports = {
    getAllMode:getAllMode,
    getSingleModeDetail:getSingleModeDetail,
    createMode:createMode,
    deleteMode: deleteMode,
    updateMode:updateMode
}