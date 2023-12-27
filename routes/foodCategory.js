const express = require('express');
const foodCategoryController = require("../controllers/foodCategoryController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/category`;

    app.get(`${baseUrl}/view/all`, foodCategoryController.getAllFoodCategory);

    app.post(`${baseUrl}/create`, foodCategoryController.createCategory);

    app.get(`${baseUrl}/:id/delete`, foodCategoryController.deleteCategory);

    app.post(`${baseUrl}/:id/update`, foodCategoryController.updateCategory);

    app.get(`${baseUrl}/:id/getById`,foodCategoryController.getSingleCategoryDetail)

    app.get(`${baseUrl}/:id/getSubCatList`, foodCategoryController.getSubCategoryListById)

    app.get(`${baseUrl}/getCatListByName`, foodCategoryController.getCategoryListByName)

}
