
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockManagerSchema = new Schema(
 {
 stockManagerId: {
   type: String,
   default: '',
   index: true,
   unique: true
 },
 firstName: {
   type: String,
   default: ''
 },
 lastName: {
   type: String,
   default: ''
 },
 password: {
   type: String,
   default: ''
 },
 mobileNumber: {
  type: String,
  default: ''
},
 email: {
   type: String,
   default: ''
 },
 role:{
   type: String,
   deafault:''
 },
 status: {
  type:String,
  default:''
},
 validationToken: { //will generate automatically while resetting password
   type: String,
   default: ''
 },

 createdOn :{
   type:Date,
   default:""
 },


 
})


mongoose.model('stockManager', stockManagerSchema);