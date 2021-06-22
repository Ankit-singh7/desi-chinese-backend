const express = require('express');
const salesReportController = require("../controllers/salesReportController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/sales-report`;

    app.get(`${baseUrl}/view/all`, salesReportController.getAllSalesReport);


}
