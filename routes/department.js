const express = require('express');
const departmentController = require("../controllers/departmentController");
const appConfig = require("../config/appConfig")
const auth = require('../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/department`;

    app.get(`${baseUrl}/view/all`, departmentController.getAllDepartment);

    app.post(`${baseUrl}/create`, departmentController.createDepartment);

    app.get(`${baseUrl}/:id/delete`, departmentController.deleteDepartment);

    app.put(`${baseUrl}/:id/update`, departmentController.updateDepartment);

    app.get(`${baseUrl}/:id/getById`, departmentController.getSingleDepartmentDetail);

}
