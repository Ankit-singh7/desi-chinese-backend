const express = require('express');
const stockOutController = require("../controllers/stockOutController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/stock-out`;

    app.get(`${baseUrl}/view/all`, stockOutController.getAllStockOutList);

    app.post(`${baseUrl}/create`, stockOutController.createStockOut);

    app.get(`${baseUrl}/:id/delete`, stockOutController.deleteStockOut);

    app.get(`${baseUrl}/:id/getById`,stockOutController.getSingleStockOutDetail);


}
