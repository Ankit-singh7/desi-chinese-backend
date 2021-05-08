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
const moment = require('moment')

let getAllBill = (req,res) => {
    billModel.find()
    .lean()
    .exec((err,result) => {
        if(err) {
            console.log(err)
            logger.error(err.message, 'Bill Controller: getAllBill', 10)
            let apiResponse = response.generate(true, 'Failed To Find Food Sub-Category Details', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            logger.info('No Data Found', 'Bill Controller: getAllBill')
            let apiResponse = response.generate(true, 'No Data Found', 404, null)
            res.send(apiResponse)
        }  else {
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


let createBill = (req,res) => {
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



    newSubCategory.save((err,result) => {
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
            .exec((err,result) => {
                if(err) {
                    console.log(err)
                } else if (check.isEmpty(result)) {
                    let total = new totalModel({
                        total_id: 123,
                        total: req.body.total_price
                    })
       
                    total.save((err,result) => {
                        if(err) {
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
                     totalModel.update({'total_id': 123}, option)
                     .lean()
                     .exec((err,result) => {
                         if(err) {
                             console.log(err)
                         } else {
                             console.log(result)
                             console.log(newTotal)
                             for(let item of req.body.products) {
                               console.log(item)
                               foodIngredientModel.find({'sub_category_id': item.food_id}, (err,result) => {
                                   if(err) {
                                       res.send('Failed to find the ingredients')
                                   } else if(check.isEmpty(result)) {
                                       let apiResponse = response.generate(true, 'No Detail Found', 404, null)
                                       res.send(apiResponse)
                                   } else {
                                       for(let i of result) {
                                          let quantity = String(item.quantity * Number(i.quantity))
                                          ingredientReportModel.find({'date': moment(time.now()).format('DD-MM-YYYY')}).exec((err,result) => {
                                              if(err){
                                               let apiResponse = response.generate(true, 'Failed to find the data', 500, null)
                                               res.send(apiResponse)
                                              } else if(check.isEmpty(result)){
                                               let report  = new ingredientReportModel({
                                                   date: moment(time.now()).format('DD-MM-YYYY'),
                                                   ingredient:[
                                                      {
                       
                                                          ingredient_id: i.ingredient_id,
                                                          category: i.category,
                                                          category_id: i.category_id,
                                                          ingredient: i.ingredient,
                                                          unit_id: i.unit_id,
                                                          unit: i.unit,
                                                          quantity_by_order: quantity,
                                                          quantity_by_stock: 0
                                                      }
                                                   ]
                                                   
                                                 })
                       
                                                 report.save((err,result) => {
                                                     if(err){
                                                        console.log('failed to save')
                                                     } else {
                                                         console.log('successfully saved')
                                                     }
                                                 })
                                              } else {
                                               ingredientReportModel.find({'ingredient_id': i.ingredient_id},(err,result) => {
                                                   if(err) {
                                                       res.send(err)
                                                   } else if (check.isEmpty(result)) {
                                                       let report  = new ingredientReportModel({
                                                           date: moment(time.now()).format('DD-MM-YYYY'),
                                                           ingredient:[
                                                              {
                               
                                                                  ingredient_id: i.ingredient_id,
                                                                  category: i.category,
                                                                  category_id: i.category_id,
                                                                  ingredient: i.ingredient,
                                                                  unit_id: i.unit_id,
                                                                  unit: i.unit,
                                                                  quantity_by_order: quantity,
                                                                  quantity_by_stock: 0
                                                              }
                                                           ]
                                                           
                                                         })
                                                         report.save((err,result) => {
                                                           if(err){
                                                               console.log('failed to save')
                                                            } else {
                                                                console.log('successfully saved')
                                                            }
                                                       })
                                                   } else {
                                                           console.log(result[0]);
                                                   }
                                               })
                                              }
                                          })
                          
                                       }
                                   }
                               })
                           }
                         }
                     })
                }
            })
        }
    })

// for changing total sale



  


}

let getTotalSales = (req,res) => {
    totalModel.find()
    .lean()
    .select('-total_id -__v -_id')
    .exec((err,result) => {
        if(err) {
            console.log(err)
            logger.error(err.message, 'Bill Controller: getTotalSales', 10)
            let apiResponse = response.generate(true, 'Failed To get the total', 500, null)
            res.send(apiResponse)
        }  else if (check.isEmpty(result)) {
            logger.info('No Data Found', 'Bill Controller: getTotalSales')
            let apiResponse = response.generate(true, 'No Data Found', 404, null)
            res.send(apiResponse)
        }  else {
            let apiResponse = response.generate(false, 'Total sale', 200, result)
            res.send(apiResponse)
        }
    })
}


let deleteBill = (req,res) => {
    billModel.findOneAndRemove({'bill_id':req.params.id})
    .exec((err,result) => {
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


let updateBill = (req,res) => {
    let option = req.body
    billModel.update({'bill_id':req.params.id},option,{multi:true})
    .exec((err,result) => {
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