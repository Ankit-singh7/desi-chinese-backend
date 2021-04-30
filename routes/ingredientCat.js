const express = require('express');
const ingredientCatController = require("../controllers/ingredientCategoryController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/ingredientCat`;

    app.get(`${baseUrl}/view/all`, ingredientCatController.getAllIngredientCategory);

    app.post(`${baseUrl}/create`, ingredientCatController.createIngredientCategory);

    app.get(`${baseUrl}/:id/delete`, ingredientCatController.deleteIngredientCategory);

    app.put(`${baseUrl}/:id/update`, ingredientCatController.updateIngredientCategory);

    app.get(`${baseUrl}/:id/getById`, ingredientCatController.getSingleIngredientCatDetail);

}
