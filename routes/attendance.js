const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const appConfig = require("../config/appConfig");
const upload = require('../middlewares/multer');

module.exports.setRouter = (app) => {
    let baseUrl = `${appConfig.apiVersion}/attendance`;

    app.post(`${baseUrl}/punch`, upload.single('photo'), attendanceController.punch);

    app.get(`${baseUrl}/dashboard/:employeeId`, attendanceController.getDashboard);

    app.get(`${baseUrl}/attendance/list/:employeeId`, attendanceController.getAttendanceList);

    app.get(`${baseUrl}/locations`, attendanceController.getBranchesWithLocation);

    app.get(`${baseUrl}/employee/payroll/list/:employee_id`, attendanceController.getEmployeePayroll);

    app.get(`${baseUrl}/employee/payroll-slip`, attendanceController.getEmployeePayrollSlip);

    app.get(`${appConfig.apiVersion}/employee/activity/:employeeId`, attendanceController.getEmployeeActivity);

}
