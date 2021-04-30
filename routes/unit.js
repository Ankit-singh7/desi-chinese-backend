const express = require('express');
const unitController = require("../controllers/unitController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/unit`;

    app.get(`${baseUrl}/view/all`, unitController.getAllUnit);

    app.post(`${baseUrl}/create`, unitController.createUnit);

    app.get(`${baseUrl}/:id/delete`, unitController.deleteUnit);

    app.put(`${baseUrl}/:id/update`, unitController.updateUnit);

    app.get(`${baseUrl}/:id/getById`, unitController.getSingleUnitDetail);

}
