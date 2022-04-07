const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const popularFoodModel = mongoose.model('popularFood');


let getAllPopularFoods = (req,res) => {
    const filters = req.query;
    popularFoodModel.find()
    .lean()
    .select('-__v -_id')
    .exec((err,result) => {
        if(err) {
            console.log(err)
            logger.error(err.message, 'Popular Food Controller: getAllBranch', 10)
            let apiResponse = response.generate(true, 'Failed To Find ', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            logger.info('No Data Found', 'Popular Food Controller: getAllBranch')
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
                return a.food_name.localeCompare(b.food_name); //using String.prototype.localCompare()
            })
            let apiResponse = response.generate(false, 'All Popular Foods Found', 200, sortResult)
            res.send(apiResponse)
        }
    })
}



/* Get single category details */
/* params : Id
*/
let getSinglePopularFoodDetail = (req, res) => {
    popularFoodModel.findOne({ 'food_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Popular Food Controller: getSinglePopularFoodDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'Popular Food Controller: getSinglePopularFoodDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category


let createPopularFood = (req,res) => {
    console.log(req.body)
    let newCategory = new popularFoodModel({
        food_id: shortid.generate(),
        food_name: req.body.food_name,
        food_type: req.body.food_type,
        price: req.body.price,
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


let deletePopularFood = (req,res) => {
    popularFoodModel.findOneAndRemove({'food_id':req.params.id})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Popular Food Controller: deleteItem', 10)
            let apiResponse = response.generate(true, 'Failed To delete Item', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No popular food Found', 'Popular food Controller: deleteBranch')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'item Successfully deleted', 200, result)
            res.send(apiResponse)
        }
    })
}


let updatePopularFood = (req,res) => {
    let option = req.body
    popularFoodModel.updateOne({'food_id':req.params.id},option,{multi:true})
    .exec((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Popular Food Controller: updateItem', 10)
            let apiResponse = response.generate(true, 'Failed To upadate Item', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No popular food Found', 'Popular food Controller: deleteBranch')
            let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'item Successfully updated', 200, result)
            res.send(apiResponse)
        }
    })
}




module.exports = {
    getAllPopularFoods:getAllPopularFoods,
    getSinglePopularFoodDetail:getSinglePopularFoodDetail,
    createPopularFood:createPopularFood,
    deletePopularFood: deletePopularFood,
    updatePopularFood:updatePopularFood
}