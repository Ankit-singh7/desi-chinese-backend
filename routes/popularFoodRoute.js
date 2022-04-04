const express = require('express');
const popularFoodController = require("../controllers/popularFoodController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/p_food`;

    app.get(`${baseUrl}`, popularFoodController.getAllPopularFoods);

    app.post(`${baseUrl}`, popularFoodController.createPopularFood);

    app.delete(`${baseUrl}/:id`, popularFoodController.deletePopularFood);

    app.put(`${baseUrl}/:id`, popularFoodController.updatePopularFood);

    app.get(`${baseUrl}/:id`, popularFoodController.getSinglePopularFoodDetail);

}
