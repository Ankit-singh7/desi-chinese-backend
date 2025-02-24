const express = require('express');
const employeeExpenseController = require("../controllers/employeeExpenseController");
const appConfig = require("../config/appConfig")
const auth = require('../middlewares/auth')


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/employee-expense`;

    app.get(`${baseUrl}`, employeeExpenseController.getAllEmployeeExpense);

    app.post(`${baseUrl}`, employeeExpenseController.createEmployeeExpense);

    app.delete(`${baseUrl}/:id`, employeeExpenseController.deleteEmployeeExpense);

    app.put(`${baseUrl}/:id`, employeeExpenseController.updateEmployeeExpense);

    app.get(`${baseUrl}/:id`, employeeExpenseController.getExpenseDetailById);
    

    app.get(`${baseUrl}/:id/:createdOn`, employeeExpenseController.getExpenseDetailByEmployeeIdAndDate);

}
