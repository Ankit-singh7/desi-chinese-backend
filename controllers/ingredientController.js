const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const ingredientModel = mongoose.model('ingredient');


let getAllIngredient = (req,res) => {
    ingredientModel.find()
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
            let apiResponse = response.generate(false, 'All Ingredients Found', 200, result)
            res.send(apiResponse)
        }
    })
}



/* Get single category details */
/* params : Id
*/
let getSingleIngredientDetail = (req, res) => {
    ingredientModel.findOne({ 'ingredient_id': req.params.id })
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


let createIngredient = (req,res) => {
    console.log(req.body)
    let newCategory = new ingredientModel({
        ingredient_id: shortid.generate(),
        category: req.body.category,
        category_id: req.body.category_id,
        name: req.body.name,
        unit_id: req.body.unit_id,
        unit: req.body.unit,
        createdOn: time.now()
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


let deleteCategory = (req,res) => {
    ingredientModel.findOneAndRemove({'ingredient_id':req.params.id})
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


let updateCategory = (req,res) => {
    let option = req.body
    ingredientModel.update({'ingredient_id':req.params.id},option,{multi:true})
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
    getAllIngredient:getAllIngredient,
    getSingleIngredientDetail:getSingleIngredientDetail,
    createIngredient:createIngredient,
    deleteCategory:deleteCategory,
    updateCategory: updateCategory
}