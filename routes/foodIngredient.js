const express = require('express');
const foodingredientController = require("../controllers/foodIngredientController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/food-ingredient`;

    app.get(`${baseUrl}/view/:id/all`, foodingredientController.getAllFoodIngredient);

    app.post(`${baseUrl}/create`, foodingredientController.createIngredient);

    app.get(`${baseUrl}/:id/delete`, foodingredientController.deleteIngredient);

    app.put(`${baseUrl}/:id/update`, foodingredientController.updateIngredient);

    app.get(`${baseUrl}/:id/getById`, foodingredientController.getSingleIngredientDetail);

}
