const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const billModel = mongoose.model('bill')
const totalModel = mongoose.model('total')
const foodIngredientModel = mongoose.model('foodIngredient');
const ingredientReportModel = mongoose.model('ingredientReport');

let getAllBill = (req, res) => {
    billModel.find()
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: getAllBill', 10)
                let apiResponse = response.generate(true, 'Failed To Find Food Sub-Category Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Data Found', 'Bill Controller: getAllBill')
                let apiResponse = response.generate(true, 'No Data Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All Bills Found', 200, result)
                res.send(apiResponse)
            }
        })
}



/* Get single category details */
/* params : Id
*/
let getBillDetail = (req, res) => {
    billModel.findOne({ 'bill_id': req.params.id })
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: getSingleBillDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'BillCategory Controller: getSingleBillDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category


let createBill = (req, res) => {
    let newSubCategory = new billModel({
        bill_id: req.body.bill_id,
        user_name: req.body.user_name,
        customer_name: req.body.customer_name,
        customer_phone: req.body.customer_phone,
        customer_address: req.body.customer_address,
        payment_mode: req.body.payment_mode,
        delivery_mode: req.body.delivery_mode,
        total_price: req.body.total_price,
        products: req.body.products,
        createdOn: time.now()
    })



    newSubCategory.save((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Bill Controller: createBill', 10)
            let apiResponse = response.generate(true, 'Failed To create new Bill', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Bill Successfully created', 200, result)
            totalModel.find()
                .lean()
                .select('-total_id -__v -_id')
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                    } else if (check.isEmpty(result)) {
                        let total = new totalModel({
                            total_id: 123,
                            total: req.body.total_price
                        })

                        total.save((err, result) => {
                            if (err) {
                                console.log('error occured while creating the total')
                            } else {
                                console.log('successfully added')
                            }
                        })
                    } else {
                        let oldTotal = result[0].total
                        let newTotal = oldTotal + req.body.total_price
                        const option = {
                            total: newTotal
                        }
                        totalModel.update({ 'total_id': 123 }, option)
                            .lean()
                            .exec((err, result) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(result)
                                    console.log(newTotal)
                                    for (let item of req.body.products) {
                                        console.log(item)
                                        foodIngredientModel.find({ 'sub_category_id': item.food_id }, (err, ingredient) => {
                                            if (err) {
                                                res.send('Failed to find the ingredients')
                                            } else if (check.isEmpty(ingredient)) {
                                                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                                                res.send(apiResponse)
                                            } else {
                                                ingredientReportModel.find({ 'date': time.getNormalTime() }).exec((err, report) => {
                                                    if (err) {
                                                        let apiResponse = response.generate(true, 'Failed to find the data', 500, null)
                                                        res.send(apiResponse)
                                                    } else if (check.isEmpty(report)) {
                                                        let ingArray = [];

                                                        for (let i of ingredient) {

                                                            let quantity = String(item.quantity * Number(i.quantity))
                                                            let obj = {

                                                                ingredient_id: i.ingredient_id,
                                                                category: i.category,
                                                                category_id: i.category_id,
                                                                ingredient: i.ingredient,
                                                                unit_id: i.unit_id,
                                                                unit: i.unit,
                                                                quantity_by_order: quantity,
                                                                quantity_by_stock: 0
                                                            }
                                                            ingArray.push(obj)

                                                        }
                                                        let report = new ingredientReportModel({
                                                            date: time.getNormalTime(),
                                                            ingredient: ingArray

                                                        })

                                                        report.save((err, result) => {
                                                            if (err) {
                                                                console.log('failed to save')
                                                                res.send(err)
                                                            } else {
                                                                console.log('successfully saved')

                                                            }
                                                        })

                                                    } else {
                                                        console.log(report[0])

                                                        for (let i of ingredient) {

                                                            let isThere = report[0].ingredient.some((item => item.ingredient_id === i.ingredient_id))


                                                            if (isThere) {
                                                                let obj = report[0].ingredient.filter((item) => item.ingredient_id === i.ingredient_id)
                                                                console.log(obj)
                                                                console.log('all ingredient except obj')
                                                                report[0].ingredient = report[0].ingredient.filter((item) => item.ingredient_id !== i.ingredient_id)
                                                                console.log(report[0].ingredient)
                                                                console.log('edited obj')
                                                                console.log('item quantity',item.quantity)
                                                                console.log('ingredient quantity', i.quantity)
                                                                obj.quantity_by_order = String((item.quantity * Number(i.quantity)) + Number(obj.quantity_by_order))
                                                                console.log('obj quantity',  obj.quantity_by_order)
                                                                console.log(obj)
                                                                let data = {
                                                                    ingredient: report[0].ingredient.push(obj)
                                                                }
                                                                ingredientReportModel.update({ 'date': time.getNormalTime() }, data, { multi: true }).exec((err, response) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                                        console.log(response)
                                                                    }
                                                                })
                                                            } else {
                                                                let quantity = String(item.quantity * Number(i.quantity))
                                                                let newObj = {
                                                                    ingredient_id: i.ingredient_id,
                                                                    category: i.category,
                                                                    category_id: i.category_id,
                                                                    ingredient: i.ingredient,
                                                                    unit_id: i.unit_id,
                                                                    unit: i.unit,
                                                                    quantity_by_order: quantity,
                                                                    quantity_by_stock: 0
                                                                }

                                                                let data = {
                                                                    ingredient: report[0].ingredient.push(newObj)
                                                                }

                                                                ingredientReportModel.update({ 'date': time.getNormalTime() }, data, { multi: true }).exec((err, response) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                                        console.log(response)
                                                                    }
                                                                })
                                                            }

                                                        }
                                                    }
                                                })

                                            }
                                        })
                                    }
                                    res.send('bill Created')
                                }
                            })
                    }
                })
        }
    })

    // for changing total sale






}

let getTotalSales = (req, res) => {
    totalModel.find()
        .lean()
        .select('-total_id -__v -_id')
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: getTotalSales', 10)
                let apiResponse = response.generate(true, 'Failed To get the total', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Data Found', 'Bill Controller: getTotalSales')
                let apiResponse = response.generate(true, 'No Data Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Total sale', 200, result)
                res.send(apiResponse)
            }
        })
}


let deleteBill = (req, res) => {
    billModel.findOneAndRemove({ 'bill_id': req.params.id })
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: deleteBill', 10)
                let apiResponse = response.generate(true, 'Failed To delete Bill', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Bill Found', 'Bill Controller: deleteBill')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Bill Successfully deleted', 200, result)
                res.send(apiResponse)
            }
        })
}


let updateBill = (req, res) => {
    let option = req.body
    billModel.update({ 'bill_id': req.params.id }, option, { multi: true })
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: updateSubCatergory', 10)
                let apiResponse = response.generate(true, 'Failed To delete bill', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Bill Found', 'Bill Controller: updateBIll')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Bill Successfully updated', 200, result)
                res.send(apiResponse)
            }
        })
}


module.exports = {
    getAllBill: getAllBill,
    getBillDetail: getBillDetail,
    createBill: createBill,
    deleteBill: deleteBill,
    updateBill: updateBill,
    getTotalSales: getTotalSales
}