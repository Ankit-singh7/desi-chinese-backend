const express = require('express');
const billController = require("../controllers/billController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/bill`;

    app.get(`${baseUrl}/view/all`, billController.getAllBill);

    app.post(`${baseUrl}/create`, billController.createBill);

    app.get(`${baseUrl}/:id/delete`, billController.deleteBill);

    app.post(`${baseUrl}/:id/update`, billController.updateBill);

    app.post(`${baseUrl}/:id/status`, billController.changeStatus)

    app.get(`${baseUrl}/:id/getById`,billController.getBillDetail);

    app.get(`${baseUrl}/total`,billController.getTotalSales);

    app.post(`${baseUrl}/create_discount`, billController.createDiscount);

    app.post(`${baseUrl}/update_discount`, billController.updateDiscount);

    app.get(`${baseUrl}/get_discount`,billController.getDiscount);

}
