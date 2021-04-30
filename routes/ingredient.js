const express = require('express');
const ingredientController = require("../controllers/ingredientController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/ingredient`;

    app.get(`${baseUrl}/view/all`, ingredientController.getAllIngredient);

    app.post(`${baseUrl}/create`, ingredientController.createIngredient);

    app.get(`${baseUrl}/:id/delete`, ingredientController.deleteCategory);

    app.put(`${baseUrl}/:id/update`, ingredientController.updateCategory);

    app.get(`${baseUrl}/:id/getById`, ingredientController.getSingleIngredientDetail);

}
