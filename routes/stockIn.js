const express = require('express');
const stockInController = require("../controllers/stockInController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/stock-in`;

    app.get(`${baseUrl}/view/all`, stockInController.getAllStockInList);

    app.post(`${baseUrl}/create`, stockInController.createStockIn);

    app.get(`${baseUrl}/:id/delete`, stockInController.deleteStockIn);

    app.get(`${baseUrl}/:id/getById`,stockInController.getSingleStockInDetail);


}
