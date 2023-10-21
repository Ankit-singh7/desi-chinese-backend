const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const foodIngredientModel = mongoose.model('foodIngredient');
const ingredientCategoryModel = mongoose.model('ingredientCategory');
const ingredientModel = mongoose.model('ingredient')
const unitModel = mongoose.model('unit');


let getAllFoodIngredient = (req, res) => {
    foodIngredientModel.find({ 'sub_category_id': req.params.id })
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



/* Get single category details */
/* params : Id
*/
let getSingleIngredientDetail = (req, res) => {
    foodIngredientModel.findOne({ 'food_ingredient_id': req.params.id })
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


let createIngredient = (req, res) => {
    let catName, unitName, ingredientName;
    ingredientCategoryModel.find({ 'ingredient_category_id': req.body.category_id }, (err, result) => {
        if (err) {
            res.send('Ingredient Category Not found')
        } else {
            catName = result[0].name
            unitModel.find({ 'unit_id': req.body.unit_id }, (err, result) => {
                if (err) {
                    res.send('Unit Not found')
                } else {
                    unitName = result[0].name
                    ingredientModel.find({ 'ingredient_id': req.body.ingredient_id }, (err, result) => {
                        if (err) {
                            res.send('Ingredient Not found')
                        } else {
                            ingredientName = result[0].name
                            let newCategory = new foodIngredientModel({
                                food_ingredient_id: shortid.generate(),
                                sub_category_id: req.body.sub_category_id,
                                ingredient_id: req.body.ingredient_id,
                                ingredient: ingredientName,
                                category_id: req.body.category_id,
                                category: catName,
                                unit_id: req.body.unit_id,
                                unit: unitName,
                                quantity: req.body.quantity,
                                createdOn: time.now()
                            })

                            newCategory.save((err, result) => {
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
                    })

                }
            })
        }
    })


}


let deleteIngredient = (req, res) => {
    foodIngredientModel.findOneAndRemove({ 'food_ingredient_id': req.params.id })
        .exec((err, result) => {
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


let updateIngredient = (req, res) => {
    let catName, unitName, ingredientName;
    ingredientCategoryModel.find({ 'ingredient_category_id': req.body.category_id }, (err, result) => {
        if (err) {
            res.send('Ingredient Category Not found')
        } else {
            catName = result[0].name
            unitModel.find({ 'unit_id': req.body.unit_id }, (err, result) => {
                if (err) {
                    res.send('Unit Not found')
                } else {
                    unitName = result[0].name
                    ingredientModel.find({ 'ingredient_id': req.body.ingredient_id }, (err, result) => {
                        if (err) {
                            res.send('Ingredient Not found')
                        } else {
                            ingredientName = result[0].name
                            let option = req.body
                            option.category = catName
                            option.unit = unitName
                            option.ingredient = ingredientName
                            foodIngredientModel.updateOne({ 'food_ingredient_id': req.params.id }, option, { multi: true })
                                .exec((err, result) => {
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
                    })
                } 
            })
        }
    })
}




module.exports = {
    getAllFoodIngredient:getAllFoodIngredient,
    getSingleIngredientDetail:getSingleIngredientDetail,
    createIngredient:createIngredient,
    deleteIngredient:deleteIngredient,
    updateIngredient:updateIngredient
}