const express = require('express');
const ingredientReportController = require("../controllers/ingredientReportController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/report`;

    app.get(`${baseUrl}/view/all`, ingredientReportController.getAllIngredientReport);


}
