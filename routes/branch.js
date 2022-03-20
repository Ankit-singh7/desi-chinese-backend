const express = require('express');
const branchController = require("../controllers/branchController");
const appConfig = require("../config/appConfig")
const auth = require('./../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/branch`;

    app.get(`${baseUrl}`, branchController.getAllBranch);

    app.post(`${baseUrl}`, branchController.createBranch);

    app.delete(`${baseUrl}/:id`, branchController.deleteBranch);

    app.put(`${baseUrl}/:id`, branchController.updateBranch);

    app.get(`${baseUrl}/:id`, branchController.getSingleBranchDetail);

}
