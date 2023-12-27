const express = require('express');
const foodSubCategoryController = require("../controllers/foodSubCategoryController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/subcategory`;

    app.get(`${baseUrl}/view/all`, foodSubCategoryController.getAllFoodSubCategory);

    app.get(`${baseUrl}/used`, foodSubCategoryController.getMostlyUsedFood);

    app.post(`${baseUrl}/create`, foodSubCategoryController.createSubCategory);

    app.get(`${baseUrl}/:id/delete`, foodSubCategoryController.deleteSubCategory);

    app.post(`${baseUrl}/:id/update`, foodSubCategoryController.updateSubCategory);

    app.get(`${baseUrl}/:id/getById`,foodSubCategoryController.getSingleSubCategoryDetail);

    app.get(`${baseUrl}/getSubCatListByName`, foodSubCategoryController.getSubCategoryListByName)

}
