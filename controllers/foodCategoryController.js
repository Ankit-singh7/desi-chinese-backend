const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const foodCategoryModel = mongoose.model('foodCategory');
const subCategoryModel = mongoose.model('foodSubCategory')

let getAllFoodCategory = (req,res) => {
    const page = req.query.current_page
    const limit = req.query.per_page
    foodCategoryModel.find()
    .lean()
    .select('-__v -_id')
    .exec((err,result) => {
        if(err) {
            console.log(err)
            logger.error(err.message, 'FoodCategory Controller: getAllFoodCategory', 10)
            let apiResponse = response.generate(true, 'Failed To Find Food Category Details', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            logger.info('No Data Found', 'FoodCategory Controller: getAllFoodCategory')
            let apiResponse = response.generate(true, 'No Data Found', 404, null)
            res.send(apiResponse)
        }  else {
            const startIndex = (page - 1)*limit;
            const endIndex = page * limit
            let total = result.length;
            let catList = result.slice(startIndex,endIndex)
            let newResult = {total:total,result:catList}
            let apiResponse = response.generate(false, 'All Food Category Found', 200, newResult)
            res.send(apiResponse)
        }
    })
}



/* Get single category details */
/* params : Id
*/
let getSingleCategoryDetail = (req, res) => {
    foodCategoryModel.findOne({ 'category_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'FoodCategory Controller: getSingleCategoryDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'FoodCategory Controller: getSingleCategoryDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category


let createCategory = (req,res) => {
    let newCategory = new foodCategoryModel({
        category_id: shortid.generate(),
        name: req.body.name,
        createdOn: time.now()
    })

    newCategory.save((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'FoodCategory Controller: createCatergory', 10)
            let apiResponse = response.generate(true, 'Failed To create new food category', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'food Category Successfully created', 200, result)
            res.send(apiResponse)
        }
    })
}


let deleteCategory = (req,res) => {
    foodCategoryModel.findOneAndRemove({'category_id':req.params.id})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'FoodCategory Controller: deleteCatergory', 10)
            let apiResponse = response.generate(true, 'Failed To delete food category', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Category Found', 'FoodCategory Controller: deleteCategory')
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
    foodCategoryModel.updateOne({'category_id':req.params.id},option,{multi:true})
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

let getSubCategoryListById = (req,res) => {
    subCategoryModel.find({'category_id':req.params.id})
    .select('-__v -_id')
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'FoodCategory Controller: getSubCategoryListById', 10)
            let apiResponse = response.generate(true, 'Failed To get food subcategory', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No Category Found', 'FoodCategory Controller: getSubCategoryListById')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Food SubCategory Successfully found', 200, result)
            res.send(apiResponse)
        }
    })
}

let getCategoryListByName = (req, res) => {
    const searchQuery = { 'name': { $regex: new RegExp(req.query.name, 'i') } };

    foodCategoryModel.find(searchQuery)
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
    getAllFoodCategory: getAllFoodCategory,
    getSingleCategoryDetail: getSingleCategoryDetail,
    createCategory: createCategory,
    deleteCategory: deleteCategory,
    updateCategory: updateCategory,
    getSubCategoryListById:getSubCategoryListById,
    getCategoryListByName: getCategoryListByName
}