const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const foodSubCategoryModel = mongoose.model('foodSubCategory')
const foodCategoryModel = mongoose.model('foodCategory');

let getAllFoodSubCategory = (req, res) => {
    const page = req.query.current_page
    const limit = req.query.per_page
    foodSubCategoryModel.find()
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'FoodSubCategory Controller: getAllFoodSubCategory', 10)
                let apiResponse = response.generate(true, 'Failed To Find Food Sub-Category Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Data Found', 'FoodCategory Controller: getAllFoodSubCategory')
                let apiResponse = response.generate(true, 'No Data Found', 404, null)
                res.send(apiResponse)
            } else {
                const startIndex = (page - 1)*limit;
                const endIndex = page * limit
                let total = result.length;
                let foodList = result.slice(startIndex,endIndex)
                let newResult = {total:total,result:foodList}
                let apiResponse = response.generate(false, 'All Food SubCategory Found', 200, newResult)
                res.send(apiResponse)
            }
        })
}



/* Get single category details */
/* params : Id
*/
let getSingleSubCategoryDetail = (req, res) => {
    foodSubCategoryModel.findOne({ 'sub_category_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'FoodSubCategory Controller: getSingleSubCategoryDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'FoodSubCategory Controller: getSingleSubCategoryDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category


let createSubCategory = (req, res) => {
    let catName;
    foodCategoryModel.find({ 'category_id': req.body.category_id }, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            catName = result[0].name

            let newSubCategory = new foodSubCategoryModel({
                sub_category_id: shortid.generate(),
                category_id: req.body.category_id,
                category_name: catName,
                name: req.body.name,
                price: req.body.price,
                type: req.body.type,
                status: req.body.status,
                mostly_used: req.body.mostly_used,
                createdOn: time.now()
            })

            newSubCategory.save((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'FoodSubCategory Controller: createSubCategory', 10)
                    let apiResponse = response.generate(true, 'Failed To create new food category', 500, null)
                    res.send(apiResponse)
                } else {
                    let apiResponse = response.generate(false, 'food Sub Category Successfully created', 200, result)
                    res.send(apiResponse)
                }
            })
        }
    })


}

let getMostlyUsedFood =(req,res) => {
    foodSubCategoryModel.find({'mostly_used': 'Yes'}).exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'FoodSubCategory Controller: getSingleSubCategoryDetail', 10)
            let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'FoodSubCategory Controller: getSingleSubCategoryDetail')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Detail Found', 200, result)
            res.send(apiResponse)
        }
    })
}




let deleteSubCategory = (req, res) => {
    foodSubCategoryModel.findOneAndRemove({ 'sub_category_id': req.params.id })
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'FoodSubCategory Controller: deleteSubCatergory', 10)
                let apiResponse = response.generate(true, 'Failed To delete food sub category', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Category Found', 'FoodSubCategory Controller: deleteSubCategory')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Food Sub Category Successfully deleted', 200, result)
                res.send(apiResponse)
            }
        })
}


let updateSubCategory = (req, res) => {
    let catName;
    foodCategoryModel.find({ 'category_id': req.body.category_id }, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            catName = result[0].name
            let option = req.body
            option.category_name = catName
            foodSubCategoryModel.updateOne({ 'sub_category_id': req.params.id }, option, { multi: true })
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'FoodSubCategory Controller: updateSubCatergory', 10)
                        let apiResponse = response.generate(true, 'Failed To delete food sub category', 500, null)
                        res.send(apiResponse)
                    } else if (check.isEmpty(result)) {
                        logger.info('No Category Found', 'FoodSubCategory Controller: updateSubCategory')
                        let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                        res.send(apiResponse)
                    } else {
                        let apiResponse = response.generate(false, 'Food Sub Category Successfully updated', 200, result)
                        res.send(apiResponse)
                    }
                })
        }
    })

}

let getSubCategoryListByName = (req, res) => {
    const searchQuery = { 'name': { $regex: new RegExp(req.query.name, 'i') } };

    foodSubCategoryModel.find(searchQuery)
        .select('-__v -_id')
        .exec((err, result) => {
            if (err) {
                console.log(err);
                logger.error(err.message, 'FoodCategory Controller: getSubCategoryListByName', 10);
                let apiResponse = response.generate(true, 'Failed to get food subcategory', 500, null);
                res.send(apiResponse);
            } else if (check.isEmpty(result)) {
                logger.info('No Category Found', 'FoodCategory Controller: getSubCategoryListByName');
                let apiResponse = response.generate(true, 'No Detail Found', 404, null);
                res.send(apiResponse);
            } else {
                let apiResponse = response.generate(false, 'Food SubCategory successfully found', 200, result);
                res.send(apiResponse);
            }
        });
};


module.exports = {
    getAllFoodSubCategory: getAllFoodSubCategory,
    getSingleSubCategoryDetail: getSingleSubCategoryDetail,
    createSubCategory: createSubCategory,
    deleteSubCategory: deleteSubCategory,
    updateSubCategory: updateSubCategory,
    getMostlyUsedFood:getMostlyUsedFood,
    getSubCategoryListByName: getSubCategoryListByName
}