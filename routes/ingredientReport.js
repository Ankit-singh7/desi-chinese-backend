const express = require('express');
const ingredientReportController = require("../controllers/ingredientReportController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/ingredient-report`;

    app.get(`${baseUrl}/view/all`, ingredientReportController.getAllIngredientReport);

    app.get(`${baseUrl}/:date`, ingredientReportController.getIngredientReportByDate);


}
