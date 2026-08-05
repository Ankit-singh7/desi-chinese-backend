const express = require('express');
const operatorController = require('../controllers/operatorController');
const appConfig = require("../config/appConfig");
const upload = require('../middlewares/multer');

module.exports.setRouter = (app) => {
     let baseUrl = `${appConfig.apiVersion}/operator`;

     app.get(`${baseUrl}/dashboard/:operatorId`, operatorController.getDashboard);
     app.get(`${baseUrl}/employees`, operatorController.getEmployeeList);
     app.post(`${baseUrl}/punch`, upload.single('photo'), operatorController.operatorPunch);
     app.post(`${baseUrl}/punch-operator`, upload.single('photo'), operatorController.punch);
     app.post(`${baseUrl}/change-shift`, operatorController.changeShift);
     app.post(`${baseUrl}/change-branch`, operatorController.changeBranch);
     app.post(`${baseUrl}/add-fine`, operatorController.addFine);
     app.post(`${baseUrl}/add-advance`, operatorController.addAdvance);
     app.get(`${baseUrl}/activity/:operatorId`, operatorController.getRecentActivity);
     app.get(`${baseUrl}/attendance/control`, operatorController.getAttendanceControl);
     app.get(`${baseUrl}/profile/:operatorId`, operatorController.getProfile);

}
