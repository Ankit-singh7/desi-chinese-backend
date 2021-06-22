const express = require('express');
const deliveryController = require("../controllers/deliveryModeController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/delivery`;

    app.get(`${baseUrl}/view/all`, deliveryController.getAllMode);

    app.post(`${baseUrl}/create`, deliveryController.createMode);

    app.get(`${baseUrl}/:id/delete`, deliveryController.deleteMode);

    app.put(`${baseUrl}/:id/update`, deliveryController.updateMode);

    app.get(`${baseUrl}/:id/getById`, deliveryController.getSingleModeDetail);

}
