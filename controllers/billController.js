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

                                    ingredientReportModel.find({ 'date': time.getNormalTime() }).exec((err, report) => {
                                        if (err) {
                                            let apiResponse = response.generate(true, 'Failed to find the data', 500, null)
                                            console.log(err)
                                        } else if (check.isEmpty(report)) {
                                            let ingArray = []
                                            let product;
                                            let i = 0
                                            for (i = 0; i < req.body.products.length; i++) {
                                                console.log('inside product')
                                                product = req.body.products[i]
                                                console.log(req.body.products[i].quantity)
                                                foodIngredientModel.find({ 'sub_category_id': req.body.products[i].food_id }, (err, ingredient) => {
                                                    if (err) {
                                                        console.log(err)
                                                    } else if (check.isEmpty(ingredient)) {
                                                        let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                                                        console.log(apiResponse)
                                                    } else {
                                                        console.log('here')

                                                        for (let j of ingredient) {

                                                            let quantity = String(product.quantity * Number(j.quantity))
                                                            let report = new ingredientReportModel({
                                                                date: time.getNormalTime(),
                                                                ingredient_id: j.ingredient_id,
                                                                category: j.category,
                                                                category_id: j.category_id,
                                                                ingredient: j.ingredient,
                                                                unit_id: j.unit_id,
                                                                unit: j.unit,
                                                                quantity_by_order: quantity,
                                                                quantity_by_stock: 0
                                                            })

                                                            report.save((err, result) => {
                                                                if (err) {
                                                                    console.log(err)
                                                                } else {
                                                                    console.log('successfully saved thankyou')
                                                                }
                                                            })

                                                        }

                                                    }

                                                })

                                            }

                                        } else {

                                            for (let item of req.body.products) {
                                                console.log('item', item)
                                                foodIngredientModel.find({ 'sub_category_id': item.food_id }, (err, ingredient) => {
                                                    if (err) {
                                                       console.log('Failed to find igredient')
                                                    } else if (check.isEmpty(ingredient)) {
                                                        let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                                                        console.log('No ingredient')
                                                    } else {

                                                        for (let i of ingredient) {

                                                            let isThere = report.some((item => item.ingredient_id === i.ingredient_id))


                                                            if (isThere) {

                                                                for (let ri of report) {
                                                                    if (ri.ingredient_id === i.ingredient_id) {
                                                                        ri.quantity_by_order = String((item.quantity * Number(i.quantity)) + ri.quantity_by_order)
                                                                        let data = {
                                                                            quantity_by_order: ri.quantity_by_order
                                                                        }
                                                                        ingredientReportModel.update({ 'date': time.getNormalTime(), 'ingredient_id': ri.ingredient_id }, data, { multi: true }).exec((err, response) => {
                                                                            if (err) {
                                                                                console.log(err)
                                                                            } else {
                                                                                console.log(response)
                                                                                console.log('successfully updated')
                                                                            }
                                                                        })
                                                                    }
                                                                }

                                                            } else {
                                                                let quantity = String(item.quantity * Number(i.quantity))
                                                                let report = new ingredientReportModel({
                                                                    date: time.getNormalTime(),
                                                                    ingredient_id: i.ingredient_id,
                                                                    category: i.category,
                                                                    category_id: i.category_id,
                                                                    ingredient: i.ingredient,
                                                                    unit_id: i.unit_id,
                                                                    unit: i.unit,
                                                                    quantity_by_order: quantity,
                                                                    quantity_by_stock: 0
                                                                })




                                                                report.save((err, result) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                                        console.log('successfully saved thankyou')
                                                                    }
                                                                })
                                                            }

                                                        }
                                                    }
                                                })
                                            }
                                        }
                                    })
                                    console.log('item end')


                                    let apiResponse = response.generate(false, 'Bill Created', 200, null)
                                    res.send(apiResponse)
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