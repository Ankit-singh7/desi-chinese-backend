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
const discountModel = mongoose.model('discount')

const trackingNumberSchema = new mongoose.Schema({
    date: String,
    lastNumber: Number
});

// Create a model from the schema
const TrackingNumber = mongoose.model('TrackingNumber', trackingNumberSchema);

let getAllBill = (req, res) => {
    let total_sales = 0
    let total_bill_count = 0
    const page = req.query.current_page
    const limit = req.query.per_page
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const name = new RegExp(req.query.customer_name,'i')
    const filters = req.query;
    delete filters.current_page
    delete filters.per_page
    // delete filters.customer_name
    delete filters.startDate
    delete filters.endDate

    if(startDate && endDate) {
         let formatted_sd = moment(startDate,'DD-MM-YYYY')
         let formatted_ed = moment(endDate,'DD-MM-YYYY').add(1,'day')
        billModel.find({'createdOn':{ $gte:formatted_sd.format(), $lte:formatted_ed.format()}}).sort({ _id: -1 })
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
                        let isValid = true;
                        for (key in filters) {
                            if (key === 'createdOn') {
    
                                // isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                            } else {
                                isValid = isValid && user[key] == filters[key];
                            }
    
                        }
                        return isValid;
                    });
                    if(filteredUsers.length>0) {
                        for(let item of filteredUsers) {
                            total_sales = total_sales + item.total_price
                        }

                      } else {
                            total_sales = 0;
                      }
                    total_bill_count = filteredUsers.length
                    const startIndex = (page - 1) * limit;
                    const endIndex = page * limit
                    let total = `${total_sales}-${total_bill_count}`;
                    let billList = filteredUsers.slice(startIndex, endIndex)
                    let newResult = { total: total, result: billList }
                    let apiResponse = response.generate(false, 'All Bills Found', 200, newResult)
                    res.send(apiResponse)
                }
            })
    } else {
        billModel.find().sort({ _id: -1 })
            .lean()
            .exec((err, result) => {
                if (err) {
                    logger.error(err.message, 'Bill Controller: getAllBill', 10)
                    let apiResponse = response.generate(true, 'Failed To Find Food Sub-Category Details', 500, null)
                    res.send(apiResponse)
                } else if (check.isEmpty(result)) {
                    logger.info('No Data Found', 'Bill Controller: getAllBill')
                    let apiResponse = response.generate(true, 'No Data Found', 404, null)
                    res.send(apiResponse)
                } else {
                    const filteredUsers = result.filter(user => {
                        let isValid = true;
                        for (key in filters) {
                            if (key === 'createdOn') {
    
                                isValid = isValid && moment(user[key]).format('YYYY-MM-DD') == filters[key];
                            } else {
                                isValid = isValid && user[key] == filters[key];
                            }
    
                        }
                        return isValid;
                    });
                    if(filteredUsers.length>0) {
                        for(let item of filteredUsers) {
                            total_sales = total_sales + item.total_price
                        }

                      } else {
                            total_sales = 0;
                      }
                    total_bill_count = filteredUsers.length
                    const startIndex = (page - 1) * limit;
                    const endIndex = page * limit
                    let total = `${total_sales}-${total_bill_count}`;
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




let createBill = async (req, res) => {
    let formattedDate = moment(this.date).format('YYYY-MM-DD');
    let newBill;
    let isDualPayment = (req.body.dual_payment_mode === true || req.body.dual_payment_mode === 'true');
    const today = moment().format('YYYY-MM-DD');
    let billTrackingNumber;
    let trackingRecord = await TrackingNumber.findOne({ date: today });

    if (!trackingRecord) {
        // If no record exists for today, start from 1000
        billTrackingNumber = 1000;
        // Save this initial record to the database
        trackingRecord = new TrackingNumber({
            date: today,
            lastNumber: billTrackingNumber
        });
    } else {
        // Increment the last number for today
        billTrackingNumber = trackingRecord.lastNumber + 1;
        trackingRecord.lastNumber = billTrackingNumber;
    }

    // Save or update the tracking number in the database
    await trackingRecord.save();

    let commonBillFields = {
        bill_id: req.body.bill_id,
        token_id: req.body.token_id,
        bill_tracking_number: billTrackingNumber,
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
    };

    if (!isDualPayment) {
        newBill = new billModel(commonBillFields);
    } else {
        newBill = new billModel({
            ...commonBillFields,
            payment_mode_2: req.body.payment_mode_2,
            split_amount_1: req.body.split_amount_1,
            split_amount_2: req.body.split_amount_2,
        });
    }

    newBill.save((err, result) => {
        if (err) {
            logger.error(err.message, 'Bill Controller: createBill', 10);
            let apiResponse = response.generate(true, 'Failed To create new Bill', 500, null);
            res.send(apiResponse);
        } else {
            let apiResponse = response.generate(false, 'Bill Successfully created', 200, result);
            if (isDualPayment && (req.body.payment_mode_1 === 'Cash' || req.body.payment_mode_2 === 'Cash')) {
                sessionModel.findOne({ 'session_status': 'true' })
                    .select('-__v -_id')
                    .lean()
                    .exec((err, result) => {
                        if (err) {
                            logger.error(err.message, 'Session Controller: getSingleSessionDetail', 10);
                            let apiResponse = response.generate(true, 'Failed To Find Details', 500, null);
                        } else if (check.isEmpty(result)) {
                            logger.info('No User Found', 'Session Controller: getSingleSessionDetail');
                            let apiResponse = response.generate(true, 'No Detail Found', 404, null);
                        } else {
                            let option = {};
                            if (req.body.payment_mode_1 === 'Cash' && req.body.payment_mode_2 !== 'Cash') {
                                option.drawer_balance = Number(result.drawer_balance) + Number(req.body.split_amount_1);
                            } else if (req.body.payment_mode_1 !== 'Cash' && req.body.payment_mode_2 === 'Cash') {
                                option.drawer_balance = Number(result.drawer_balance) + Number(req.body.split_amount_2);
                            } else if (req.body.payment_mode_1 === 'Cash' && req.body.payment_mode_2 === 'Cash') {
                                option.drawer_balance = Number(result.drawer_balance) + Number(req.body.total_price);
                            }
                            sessionModel.updateOne({ session_id: result.session_id }, option, { multi: true }).exec((err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
            } else if (!isDualPayment && req.body.payment_mode_1 === 'Cash') {
                sessionModel.findOne({ 'session_status': 'true' })
                    .select('-__v -_id')
                    .lean()
                    .exec((err, result) => {
                        if (err) {
                            logger.error(err.message, 'Session Controller: getSingleSessionDetail', 10);
                            let apiResponse = response.generate(true, 'Failed To Find Details', 500, null);
                        } else if (check.isEmpty(result)) {
                            logger.info('No User Found', 'Session Controller: getSingleSessionDetail');
                            let apiResponse = response.generate(true, 'No Detail Found', 404, null);
                        } else {
                            let option = {
                                drawer_balance: Number(result.drawer_balance) + Number(req.body.total_price)
                            };
                            sessionModel.updateOne({ session_id: result.session_id }, option, { multi: true }).exec((err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
            }

            ingredientReportModel.find({ 'date': time.getNormalTime() }).exec((err, report) => {
                if (err) {
                    let apiResponse = response.generate(true, 'Failed to find the data', 500, null);
                    console.log(err);
                } else if (check.isEmpty(report)) {
                    let ingArray = [];
                    let product;
                    for (let i = 0; i < req.body.products.length; i++) {
                        product = req.body.products[i];
                        foodIngredientModel.find({ 'sub_category_id': req.body.products[i].food_id }, (err, ingredient) => {
                            if (err) {
                                console.log(err);
                            } else if (check.isEmpty(ingredient)) {
                                let apiResponse = response.generate(true, 'No Detail Found', 404, null);
                            } else {
                                for (let j of ingredient) {
                                    console.log('ingredient', j.quantity)
                                    let quantity = String(product.quantity * Number(j.quantity));
                                    let report = new ingredientReportModel({
                                        date: time.getNormalTime(),
                                        ingredient_id: j.ingredient_id,
                                        category: j.category,
                                        category_id: j.category_id,
                                        ingredient: j.ingredient,
                                        unit_id: j.unit_id,
                                        unit: j.unit,
                                        quantity_by_order: quantity,
                                        quantity_by_stock: 0,
                                        created_at: time.now()
                                    });
                                    ingredientModel.find({ ingredient_id: j.ingredient_id }).exec((err, result) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            let stock = result[0].stock;
                                            const option = {
                                                stock: stock - Number(quantity)
                                            };
                                            ingredientModel.updateOne({ ingredient_id: j.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    });

                                    report.save((err, result) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });

                                }

                            }

                        });

                    }

                } else {

                    for (let item of req.body.products) {
                        foodIngredientModel.find({ 'sub_category_id': item.food_id }, (err, ingredient) => {
                            if (err) {
                                console.log('Failed to find igredient', err);
                            } else if (check.isEmpty(ingredient)) {
                                let apiResponse = response.generate(true, 'No Detail Found', 404, null);
                            } else {
                                console.log('else block ingredient', ingredient);
                                for (let i of ingredient) {
                                    let isThere = report.some((item => item.ingredient_id === i.ingredient_id));
                                    if (isThere) {
                                        for (let ri of report) {
                                            if (ri.ingredient_id === i.ingredient_id) {
                                                ri.quantity_by_order = String((item.quantity * Number(i.quantity)) + ri.quantity_by_order);
                                                let data = {
                                                    quantity_by_order: ri.quantity_by_order
                                                };
                                                ingredientReportModel.updateOne({
                                                    'date': time.now(),
                                                    'ingredient_id': ri.ingredient_id
                                                }, data, { multi: true }).exec((err, response) => {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });
                                                ingredientModel.find({ ingredient_id: ri.ingredient_id }).exec((err, result) => {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        let quantity2 = Number(item.quantity) * Number(i.quantity);
                                                        let stock = result[0].stock;
                                                        const option = {
                                                            stock: stock - Number(quantity2)
                                                        };
                                                        ingredientModel.updateOne({ ingredient_id: ri.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }

                                    } else {
                                        let quantity = String(item.quantity * Number(i.quantity));
                                        let report = new ingredientReportModel({
                                            date: time.getNormalTime(),
                                            ingredient_id: i.ingredient_id,
                                            category: i.category,
                                            category_id: i.category_id,
                                            ingredient: i.ingredient,
                                            unit_id: i.unit_id,
                                            unit: i.unit,
                                            quantity_by_order: quantity,
                                            quantity_by_stock: 0,
                                            created_at: time.now()
                                        });

                                        report.save((err, result) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });

                                        ingredientModel.find({ ingredient_id: i.ingredient_id }).exec((err, result) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                let quantity2 = Number(item.quantity) * Number(i.quantity);
                                                let stock = result[0].stock;
                                                const option = {
                                                    stock: stock - Number(quantity2)
                                                };
                                                ingredientModel.updateOne({ ingredient_id: i.ingredient_id }, option, { multi: true }).exec((err, result) => {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });
                                            }
                                        });
                                    }

                                }
                            }
                        });
                    }
                }
            });
            apiResponse = response.generate(false, 'Bill Created', 200, null);
            res.send(apiResponse);
        }

    })
}


let getTotalSales = (req, res) => {
    const filters = req.query;
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    delete filters.startDate
    delete filters.endDate
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
                        let isValid = true;
                        for (key in filters) {
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
                        let isValid = true;
                        for (key in filters) {
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
                    console.log('inside first delete promise')
                    console.log(billerr)
                    reject(billerr)
                } else {
                    bill = billresult
                    resolve(bill)
                }
            })
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
                        resolve('not current sessions')
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
            ingredientReportModel.find().exec((err,report) => {
                if(err) {
                    console.log(err)
                } else {
                    console.log(report)
                }
            })
            ingredientReportModel.find({'date': String(moment(bill.createdOn).format('DD-MM-YYYY'))}).exec((rErr,report) => {
                if(rErr) {
                    console.log(err);
                } else if(check.isEmpty(report)) {
                    console.log('inside first stock promise')
                    console.log('No data found')
                    resolve('no ingredient & stock found');
                } else {
                    for(let item of bill.products) {
                        foodIngredientModel.find({ 'sub_category_id': item.food_id }, (Ierr, ingredient) => {
                            if(Ierr) {
                                console.log(Ierr)
                            } else if(check.isEmpty(ingredient)) {
                            } else {
                                for(let i of ingredient) {
                                    for (let ri of report) {
                                        if (ri.ingredient_id === i.ingredient_id) {
                                            ri.quantity_by_order = Number(ri.quantity_by_order) > (Number(item.quantity) * Number(i.quantitsy)) ? String(Number(ri.quantity_by_order) - (Number(item.quantity) * Number(i.quantity))): 0;
                                            let data = {
                                                quantity_by_order: ri.quantity_by_order
                                            }
                                            ingredientReportModel.updateOne({ 'date': time.getNormalTime(), 'ingredient_id': ri.ingredient_id }, data, { multi: true }).exec((err, response) => {
                                                if (err) {
                                                    console.log(err)
                                                } else {
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
                      console.log('inside final delete promise')
                } else {
                    let apiResponse = response.generate(false, 'Bill Successfully deleted', 200, result)
                    res.send(apiResponse)
                    resolve('Bill Successfully deleted')
                }
            })
        })
    }

    getBillDetail(req,res)
       .then(updateDrawerBalance)
       .then(updateIGReport_and_stock)
       .then(deleteBill)
       .then((resolve) => {
        let apiResponse = response.generate(false, 'Bill Deleted Successfully', 200, resolve)
        res.status(200)
        res.send(apiResponse)
       }).catch((err) => {
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

let createDiscount = (req,res) => {
    let newDiscount = new discountModel({
        discount_id: 'dine_charges',
        discount: req.body.discount,
        SGST: req.body.sgst,
        CGST: req.body.cgst
    })

    newDiscount.save((err,result) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'Bill Controller: Discount creation failed', 10)
            let apiResponse = response.generate(true, 'Failed To create discount', 500, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'discount Successfully created', 200, result)
            res.send(apiResponse)
        }
    })
}

let updateDiscount = (req,res) => {
    let option = req.body
    option.last_updated = time.now()
    let discount_id = 'dine_charges';
    discountModel.updateOne({ 'discount_id': discount_id }, option, { multi: true })
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: updateDiscount', 10)
                let apiResponse = response.generate(true, 'Failed To update discount', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No discount found', 'Bill Controller: updateDiscount')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Discount Successfully updated', 200, result)
                res.send(apiResponse)
            }
        })
}

let getDiscount = (req, res) => {
    let discount_id = 'dine_charges';
    discountModel.findOne({ 'discount_id': discount_id})
        .select('-__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Bill Controller: getDiscountDetail', 10)
                let apiResponse = response.generate(true, 'Failed To Find Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'BillCategory Controller: getDiscountDetail')
                let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Detail Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get single category




module.exports = {
    getAllBill: getAllBill,
    getBillDetail: getBillDetail,
    createBill: createBill,
    deleteBill: deleteBill,
    updateBill: updateBill,
    changeStatus: changeStatus,
    getTotalSales: getTotalSales,
    createDiscount:createDiscount,
    updateDiscount:updateDiscount,
    getDiscount:getDiscount
}