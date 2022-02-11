const mongoose = require('mongoose');
const shortid = require('shortid');
const customId = require('custom-id');

const time = require('./../libs/timeLib');
const moment = require('moment')//npm install moment --save
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')
/* Models */
const billModel = mongoose.model('bill')
const totalModel = mongoose.model('total')
const foodIngredientModel = mongoose.model('foodIngredient');
const ingredientReportModel = mongoose.model('ingredientReport');
const ingredientModel = mongoose.model('ingredient');
const sessionModel = mongoose.model('session');
const salesReportModel = mongoose.model('salesReport')

let getAllBill = (req, res) => {
    const page = req.query.current_page
    const limit = req.query.per_page
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const filters = req.query;
    delete filters.current_page
    delete filters.per_page
    delete filters.startDate
    delete filters.endDate
    console.log('filter', filters)

    if(startDate && endDate) {
         console.log('here')
         console.log('billStart',startDate)
         console.log('billEnd', endDate)
        billModel.find({'date':{ $gte:startDate, $lte:endDate}}).sort({ _id: -1 })
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
                    const filteredUsers = result.filter(user => {
                        console.log('here', user)
                        let isValid = true;
                        for (key in filters) {
                            console.log(filters[key])
                            console.log('here', user[key])
                            if (key === 'createdOn') {
    
                                isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                            } else {
                                isValid = isValid && user[key] == filters[key];
                            }
    
                        }
                        return isValid;
                    });
                    const startIndex = (page - 1) * limit;
                    const endIndex = page * limit
                    let total = result.length;
                    let billList = filteredUsers.slice(startIndex, endIndex)
                    let newResult = { total: total, result: billList }
                    let apiResponse = response.generate(false, 'All Bills Found', 200, newResult)
                    res.send(apiResponse)
                }
            })
    } else {
      console.log('no date')
        billModel.find().sort({ _id: -1 })
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
                    const filteredUsers = result.filter(user => {
                        console.log('here', user)
                        let isValid = true;
                        for (key in filters) {
                            console.log(filters[key])
                            console.log('here', user[key])
                            if (key === 'createdOn') {
    
                                isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                            } else {
                                isValid = isValid && user[key] == filters[key];
                            }
    
                        }
                        return isValid;
                    });
                    const startIndex = (page - 1) * limit;
                    const endIndex = page * limit
                    let total = result.length;
                    let billList = filteredUsers.slice(startIndex, endIndex)
                    let newResult = { total: total, result: billList }
                    let apiResponse = response.generate(false, 'All Bills Found', 200, newResult)
                    res.send(apiResponse)
                }
            })
    }

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
    let newBill;
    if(req.body.dual_payment_mode === false  || req.body.dual_payment_mode === 'false' ) {

        
        newBill = new billModel({
            bill_id: req.body.bill_id,
            token_id: req.body.token_id,
            user_name: req.body.user_name,
            customer_name: req.body.customer_name,
            customer_phone: req.body.customer_phone,
            customer_alternative_phone: req.body.customer_alternative_phone,
            customer_address: req.body.customer_address,
            payment_mode: req.body.payment_mode_1,
            delivery_mode: req.body.delivery_mode,
            dual_payment_mode: req.body.dual_payment_mode,
            total_price: req.body.total_price,
            printed: 'No',
            status: 'in-queue',
            products: req.body.products,
            date: time.getNormalTime(),
            createdOn: time.now()
        })
        
    } else if(req.body.dual_payment_mode === true  || req.body.dual_payment_mode === 'true' ){
        newBill = new billModel({
            bill_id: req.body.bill_id,
            token_id: req.body.token_id,
            user_name: req.body.user_name,
            customer_name: req.body.customer_name,
            customer_phone: req.body.customer_phone,
            customer_alternative_phone: req.body.customer_alternative_phone,
            customer_address: req.body.customer_address,
            payment_mode: req.body.payment_mode_1,
            payment_mode_2: req.body.payment_mode_2,
            split_amount_1: req.body.split_amount_1,
            split_amount_2: req.body.split_amount_2,
            dual_payment_mode: req.body.dual_payment_mode,
            delivery_mode: req.body.delivery_mode,
            total_price: req.body.total_price,
            printed: 'No',
            status: 'in-queue',
            products: req.body.products,
            date: time.getNormalTime(),
            createdOn: time.now()
        })
    }



    newBill.save((err, result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Bill Controller: createBill', 10)
            let apiResponse = response.generate(true, 'Failed To create new Bill', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Bill Successfully created', 200, result)
            if(req.body.payment_mode === 'Cash') {
                console.log('mode is cash')
                sessionModel.findOne({'session_status': 'true'})
                .select('-__v -_id')
                .lean()
                .exec((err, result) => {
                    if (err) {
                         console.log(err)
                         logger.error(err.message, 'Session Controller: getSingleSessionDetail', 10)
                         let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                         console.log(apiResponse);
                    } else if (check.isEmpty(result)) {
                         logger.info('No User Found', 'Session Controller: getSingleSessionDetail')
                         let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                         console.log(apiResponse);
                    } else {
                       console.log(result)
                       let option = {
                           drawer_balance: Number(result.drawer_balance) + Number(req.body.total_price)
                       }
                       sessionModel.updateOne({session_id: result.session_id},option,{multi:true}).exec((err,result) => {
                           if(err){
                               console.log(err)
                           } else {
                               console.log(result)
                           }
                       })
                    
                    }
                 })
            }
            for(let item of req.body.products) {
               salesReportModel.findOne({'date': time.getNormalTime(),'food_id': item.food_id}).exec((err,result) => {
                   if(err){
                       console.log(err)
                   } else if (check.isEmpty(result)) {
                       let sales = new salesReportModel({
                        sales_report_id: shortid.generate(),
                        date: time.getNormalTime(),
                        food_name: item.food_name,
                        food_id: item.food_id,
                        quantity: Number(item.quantity)
                       })
                       sales.save((err,result) => {
                           if(err) {
                               console.log(err)
                           } else {
                               console.log(result)
                           }
                       })
                   } else {
                       let obj = {
                          quantity: Number(result.quantity) + Number(item.quantity) 
                       }
                       salesReportModel.updateOne({'sales_report_id': result.sales_report_id},obj,{multi:true}).exec((err,result) => {
                           if(err) {
                               console.log(err)
                           } else {
                               console.log(result)
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
                                                    ingredientModel.find({ ingredient_id: j.ingredient_id }).exec((err, result) => {
                                                        if (err) {
                                                            console.log(err)
                                                        } else {
                                                            let stock = result[0].stock
                                                            const option = {
                                                                stock: stock - Number(quantity)
                                                            }
                                                            ingredientModel.updateOne({ ingredient_id: j.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                                if (err) {
                                                                    console.log(err)
                                                                } else {
                                                                    console.log('stock updated successfully')
                                                                    console.log(result)
                                                                }
                                                            })
                                                        }
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
                                                                ingredientReportModel.updateOne({ 'date': time.getNormalTime(), 'ingredient_id': ri.ingredient_id }, data, { multi: true }).exec((err, response) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                                        console.log(response)
                                                                        console.log('successfully updated')
                                                                    }
                                                                })
                                                                ingredientModel.find({ ingredient_id: ri.ingredient_id }).exec((err, result) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                                        let quantity2 = Number(item.quantity) * Number(i.quantity)
                                                                        let stock = result[0].stock
                                                                        const option = {
                                                                            stock: stock - Number(quantity2)
                                                                        }
                                                                        ingredientModel.updateOne({ ingredient_id: ri.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                                            if (err) {
                                                                                console.log(err)
                                                                            } else {
                                                                                console.log('stock updated successfully')
                                                                                console.log(result)
                                                                            }
                                                                        })
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

                                                        ingredientModel.find({ ingredient_id: i.ingredient_id }).exec((err, result) => {
                                                            if (err) {
                                                                console.log(err)
                                                            } else {
                                                                let quantity2 = Number(item.quantity) * Number(i.quantity)
                                                                let stock = result[0].stock
                                                                const option = {
                                                                    stock: stock - Number(quantity2)
                                                                }
                                                                ingredientModel.updateOne({ ingredient_id: i.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                                    if (err) {
                                                                        console.log(err)
                                                                    } else {
                                                                        console.log('stock updated successfully')
                                                                        console.log(result)
                                                                    }
                                                                })
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
            // totalModel.find({ 'date': time.getNormalTime(),'payment_mode': req.body.payment_mode,'delivery_mode': req.body.delivery_mode, 'bill_by': req.body.user_name })
            //     .exec((err, totalS) => {
            //         if (err) {
            //             console.log(err)
            //         } else if (check.isEmpty(totalS)) {
            //             console.log('date here')
            //             let total = new totalModel({
            //                 total_id: shortid.generate(),
            //                 total: req.body.total_price,
            //                 payment_mode: req.body.payment_mode,
            //                 delivery_mode: req.body.delivery_mode,
            //                 bill_by: req.body.user_name,
            //                 date: time.getNormalTime(),
            //                 createdOn: time.now()
            //             })

            //             total.save((err, result) => {
            //                 if (err) {
            //                     console.log(err)
            //                 } else {
            //                     console.log('successfully total added')
                           
            //                 }
            //             })
            //         } else {
            //             let oldTotal = totalS[0].total
            //             let newTotal = Number(oldTotal) + Number(req.body.total_price)
            //             const option = {
            //                 total: newTotal
            //             }
            //             totalModel.updateOne({ 'total_id': totalS[0].total_id }, option, { multi: true })
            //                 .exec((err, result) => {
            //                     if (err) {
            //                         console.log(err)
            //                     } else {
            //                         console.log(result)
            //                         console.log(newTotal)
            //                         ingredientReportModel.find({ 'date': time.getNormalTime() }).exec((err, report) => {
            //                             if (err) {
            //                                 let apiResponse = response.generate(true, 'Failed to find the data', 500, null)
            //                                 console.log(err)
            //                             } else if (check.isEmpty(report)) {
            //                                 let ingArray = []
            //                                 let product;
            //                                 let i = 0
            //                                 for (i = 0; i < req.body.products.length; i++) {
            //                                     console.log('inside product')
            //                                     product = req.body.products[i]
            //                                     console.log(req.body.products[i].quantity)
            //                                     foodIngredientModel.find({ 'sub_category_id': req.body.products[i].food_id }, (err, ingredient) => {
            //                                         if (err) {
            //                                             console.log(err)
            //                                         } else if (check.isEmpty(ingredient)) {
            //                                             let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            //                                             console.log(apiResponse)
            //                                         } else {
            //                                             console.log('here')

            //                                             for (let j of ingredient) {

            //                                                 let quantity = String(product.quantity * Number(j.quantity))
            //                                                 let report = new ingredientReportModel({
            //                                                     date: time.getNormalTime(),
            //                                                     ingredient_id: j.ingredient_id,
            //                                                     category: j.category,
            //                                                     category_id: j.category_id,
            //                                                     ingredient: j.ingredient,
            //                                                     unit_id: j.unit_id,
            //                                                     unit: j.unit,
            //                                                     quantity_by_order: quantity,
            //                                                     quantity_by_stock: 0
            //                                                 })
            //                                                 ingredientModel.find({ ingredient_id: j.ingredient_id }).exec((err, result) => {
            //                                                     if (err) {
            //                                                         console.log(err)
            //                                                     } else {
            //                                                         let stock = result[0].stock
            //                                                         const option = {
            //                                                             stock: stock - Number(quantity)
            //                                                         }
            //                                                         ingredientModel.update({ ingredient_id: j.ingredient_id }, option, { multi: true }).exec((err, result) => {
            //                                                             if (err) {
            //                                                                 console.log(err)
            //                                                             } else {
            //                                                                 console.log('stock updated successfully')
            //                                                                 console.log(result)
            //                                                             }
            //                                                         })
            //                                                     }
            //                                                 })


            //                                                 report.save((err, result) => {
            //                                                     if (err) {
            //                                                         console.log(err)
            //                                                     } else {
            //                                                         console.log('successfully saved thankyou')
            //                                                     }
            //                                                 })

            //                                             }

            //                                         }

            //                                     })

            //                                 }

            //                             } else {

            //                                 for (let item of req.body.products) {
            //                                     console.log('item', item)
            //                                     foodIngredientModel.find({ 'sub_category_id': item.food_id }, (err, ingredient) => {
            //                                         if (err) {
            //                                             console.log('Failed to find igredient')
            //                                         } else if (check.isEmpty(ingredient)) {
            //                                             let apiResponse = response.generate(true, 'No Detail Found', 404, null)
            //                                             console.log('No ingredient')
            //                                         } else {

            //                                             for (let i of ingredient) {

            //                                                 let isThere = report.some((item => item.ingredient_id === i.ingredient_id))


            //                                                 if (isThere) {

            //                                                     for (let ri of report) {
            //                                                         if (ri.ingredient_id === i.ingredient_id) {
            //                                                             ri.quantity_by_order = String((item.quantity * Number(i.quantity)) + ri.quantity_by_order)
            //                                                             let data = {
            //                                                                 quantity_by_order: ri.quantity_by_order
            //                                                             }
            //                                                             ingredientReportModel.update({ 'date': time.getNormalTime(), 'ingredient_id': ri.ingredient_id }, data, { multi: true }).exec((err, response) => {
            //                                                                 if (err) {
            //                                                                     console.log(err)
            //                                                                 } else {
            //                                                                     console.log(response)
            //                                                                     console.log('successfully updated')
            //                                                                 }
            //                                                             })
            //                                                             ingredientModel.find({ ingredient_id: ri.ingredient_id }).exec((err, result) => {
            //                                                                 if (err) {
            //                                                                     console.log(err)
            //                                                                 } else {
            //                                                                     let quantity2 = Number(item.quantity) * Number(i.quantity)
            //                                                                     let stock = result[0].stock
            //                                                                     const option = {
            //                                                                         stock: stock - Number(quantity2)
            //                                                                     }
            //                                                                     ingredientModel.update({ ingredient_id: ri.ingredient_id }, option, { multi: true }).exec((err, result) => {
            //                                                                         if (err) {
            //                                                                             console.log(err)
            //                                                                         } else {
            //                                                                             console.log('stock updated successfully')
            //                                                                             console.log(result)
            //                                                                         }
            //                                                                     })
            //                                                                 }
            //                                                             })
            //                                                         }
            //                                                     }

            //                                                 } else {
            //                                                     let quantity = String(item.quantity * Number(i.quantity))
            //                                                     let report = new ingredientReportModel({
            //                                                         date: time.getNormalTime(),
            //                                                         ingredient_id: i.ingredient_id,
            //                                                         category: i.category,
            //                                                         category_id: i.category_id,
            //                                                         ingredient: i.ingredient,
            //                                                         unit_id: i.unit_id,
            //                                                         unit: i.unit,
            //                                                         quantity_by_order: quantity,
            //                                                         quantity_by_stock: 0
            //                                                     })




            //                                                     report.save((err, result) => {
            //                                                         if (err) {
            //                                                             console.log(err)
            //                                                         } else {
            //                                                             console.log('successfully saved thankyou')
            //                                                         }
            //                                                     })

            //                                                     ingredientModel.find({ ingredient_id: i.ingredient_id }).exec((err, result) => {
            //                                                         if (err) {
            //                                                             console.log(err)
            //                                                         } else {
            //                                                             let quantity2 = Number(item.quantity) * Number(i.quantity)
            //                                                             let stock = result[0].stock
            //                                                             const option = {
            //                                                                 stock: stock - Number(quantity2)
            //                                                             }
            //                                                             ingredientModel.update({ ingredient_id: i.ingredient_id }, option, { multi: true }).exec((err, result) => {
            //                                                                 if (err) {
            //                                                                     console.log(err)
            //                                                                 } else {
            //                                                                     console.log('stock updated successfully')
            //                                                                     console.log(result)
            //                                                                 }
            //                                                             })
            //                                                         }
            //                                                     })
            //                                                 }

            //                                             }
            //                                         }
            //                                     })
            //                                 }
            //                             }
            //                         })
            //                         console.log('item end')


            //                         let apiResponse = response.generate(false, 'Bill Created', 200, null)
            //                         res.send(apiResponse)
            //                     }

            //                 })

            //         }





            //     })
        }
    })

    // for changing total sale






}


let getTotalSales = (req, res) => {
    const filters = req.query;
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    delete filters.startDate
    delete filters.endDate
    console.log('filter', filters)
    if(startDate && endDate) {

        totalModel.find({'date':{ $gte:startDate, $lte:endDate}})
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
                    const filteredUsers = result.filter(user => {
                        console.log('here', user)
                        let isValid = true;
                        for (key in filters) {
                            console.log(filters[key])
                            console.log('here', user[key])
                            if (key === 'createdOn') {
    
                                isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                            } else {
                                isValid = isValid && user[key] == filters[key];
                            }
    
                        }
                        return isValid;
                    });
                    let apiResponse = response.generate(false, 'All Sales Found', 200, filteredUsers)
                    res.send(apiResponse)
                }
            })
    } else {
       
        totalModel.find()
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
                    const filteredUsers = result.filter(user => {
                        console.log('here', user)
                        let isValid = true;
                        for (key in filters) {
                            console.log(filters[key])
                            console.log('here', user[key])
                            if (key === 'createdOn') {
    
                                isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                            } else {
                                isValid = isValid && user[key] == filters[key];
                            }
    
                        }
                        return isValid;
                    });
                    let apiResponse = response.generate(false, 'All Sales Found', 200, filteredUsers)
                    res.send(apiResponse)
                }
            }) 
    }
}

let deleteBill = (req, res) => {
    let bill;
    let getBillDetail = () => {
        return new Promise((resolve,reject) => {

            billModel.findOne({ 'bill_id': req.params.id }).exec((billerr,billresult) => {
                if(billerr){
                    console.log(billerr)
                    reject(billerr)
                } else {
                    console.log(billresult)
                    bill = billresult
                    resolve(bill)
                }
            })
        })
    }


let updateSalesReport = () => {
    return new Promise((resolve,reject) => {
        for(let item of bill.products) {
            salesReportModel.findOne({'date': moment(bill.createdOn).format('DD-MM-YYYY'),'food_id': item.food_id}).exec((err,result) => {
                if(err){
                    console.log(err)
                } else if (check.isEmpty(result)) {
                     console.log('no sales report')
                } else {
                    console.log(result)
                    let obj = {
                       quantity: Number(result.quantity) - Number(item.quantity) 
                    }
                    salesReportModel.updateOne({'sales_report_id': result.sales_report_id},obj,{multi:true}).exec((err,result) => {
                        if(err) {
                            console.log(err)
                        } else {
                            console.log(result)
                        }
                    })
                }
            })
         }
         resolve('sales updated')
    })
}

let updateDrawerBalance = () => {
        return new Promise((resolve,reject) => {
            if(bill.payment_mode === 'Cash') {

                sessionModel.findOne({'session_status': 'true'})
                   .select('-__v -_id')
                   .lean()
                   .exec((err, sResult) => {
                     if (err) {
                        console.log(err)
                     } else if (check.isEmpty(sResult)) {
                        console.log('no active session')
                     } else {

                         let newObj = {
                                drawer_balance: Number(sResult.drawer_balance) - Number(bill.total_price),
                                cash_income: Number(sResult.cash_income) - Number(bill.total_price)
                             }

                             sessionModel.updateOne({'session_id': sResult.session_id },newObj,{multi:true}).exec((updateErr, updateResult) => {
                                    if(updateErr){
                                      console.log(updateErr)
                                    } else {
                                       resolve(updateResult)
                                    }
                             })

                    }
                  })
            } else {
                resolve('payment_mode is not Cash')
            }
      })
    }

    let updateIGReport_and_stock = () => {
        return new Promise((resolve,reject) => {
            ingredientReportModel.find({'date': moment(bill.createdOn).format('DD-MM-YYYY')}).exec((rErr,report) => {
                if(rErr) {
                    console.log(err);
                } else if(check.isEmpty(report)) {
                    console.log('No data found')
                } else {
                    for(let item of bill.products) {
                        foodIngredientModel.find({ 'sub_category_id': item.food_id }, (Ierr, ingredient) => {
                            if(Ierr) {
                                console.log(Ierr)
                            } else if(check.isEmpty(ingredient)) {
                                console.log('No ingredient Found for this food')
                            } else {
                                console.log('Ingredients Found')
                                console.log(ingredient)
                                for(let i of ingredient) {
                                    for (let ri of report) {
                                        if (ri.ingredient_id === i.ingredient_id) {
                                            ri.quantity_by_order = String(Number(ri.quantity_by_order) - (Number(item.quantity) * Number(i.quantity)))
                                            let data = {
                                                quantity_by_order: ri.quantity_by_order
                                            }
                                            ingredientReportModel.updateOne({ 'date': time.getNormalTime(), 'ingredient_id': ri.ingredient_id }, data, { multi: true }).exec((err, response) => {
                                                if (err) {
                                                    console.log(err)
                                                } else {
                                                    console.log(response)
                                                    console.log('IG Report Successfully updated')
                                                    // Updating Stocks
                                                    ingredientModel.find({ ingredient_id: ri.ingredient_id }).exec((err, result) => {
                                                        if (err) {
                                                            console.log(err)
                                                        } else {
                                                            let quantity2 = Number(item.quantity) * Number(i.quantity)
                                                            let stock = result[0].stock
                                                            const option = {
                                                                stock: stock + Number(quantity2)
                                                            }
                                                            ingredientModel.updateOne({ ingredient_id: ri.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                                if (err) {
                                                                    console.log(err)
                                                                } else {
                                                                    console.log('stock updated successfully')
                                                                    console.log(result)
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                  
                                        }
                                    }
                                }

                            }
                        })
                        resolve('report and stock updated')
                    }
                }
            })
        })
    }


    let deleteBill = () => {
        return new Promise((resolve,reject) => {
            billModel.findOneAndRemove({ 'bill_id': req.params.id })
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'Bill Controller: deleteBill', 10)
                    let apiResponse = response.generate(true, 'Failed To delete Bill', 500, null)
                    reject('Failed To delete Bill')
                } else if (check.isEmpty(result)) {
                    logger.info('No Bill Found', 'Bill Controller: deleteBill')
                    let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                      reject('No Detail Found')
                } else {
                    let apiResponse = response.generate(false, 'Bill Successfully deleted', 200, result)
                    res.send(apiResponse)
                    resolve('Bill Successfully deleted')
                }
            })
        })
    }

    getBillDetail(req,res)
       .then(updateSalesReport)
       .then(updateDrawerBalance)
       .then(updateIGReport_and_stock)
       .then(deleteBill)
       .then((resolve) => {
        let apiResponse = response.generate(false, 'Bill Deleted Successfully', 200, resolve)
        res.status(200)
        res.send(apiResponse)
       }).catch((err) => {
        console.log("errorhandler");
        console.log(err);
        res.status(err.status)
        res.send(err)
    })
 


}


let changeStatus = (req, res) => {
    let option = req.body
    if (req.body.status === 'in-cook') {
        option = {
            status: 'in-cook',
            incookAt: time.now()
        }
    } else if (req.body.status === 'cookedAt') {
        option = {
            status: 'cookedAt',
            cookedAt: time.now()
        }
    } else if (req.body.status === 'dispatchedAt') {
        option = {
            status: 'dispatchedAt',
            dispatchedAt: time.now()
        }
    }

    billModel.updateOne({ 'bill_id': req.params.id }, option, { multi: true })
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



let updateBill = (req, res) => {
    let option = req.body
    billModel.updateOne({ 'bill_id': req.params.id }, option, { multi: true })
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
    changeStatus: changeStatus,
    getTotalSales: getTotalSales
}