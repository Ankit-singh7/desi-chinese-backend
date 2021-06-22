const express = require('express');
const paymentController = require("../controllers/paymentModeController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/payment`;

    app.get(`${baseUrl}/view/all`, paymentController.getAllMode);

    app.post(`${baseUrl}/create`, paymentController.createMode);

    app.get(`${baseUrl}/:id/delete`, paymentController.deleteMode);

    app.put(`${baseUrl}/:id/update`, paymentController.updateMode);

    app.get(`${baseUrl}/:id/getById`, paymentController.getSingleModeDetail);

}
