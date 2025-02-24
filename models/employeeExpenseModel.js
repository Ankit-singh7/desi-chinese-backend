
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let employeeExpenseSchema = new Schema(
 {
  expense_id: {
   type: String,
   default: '',
   index: true
 },
  employee_id: {
   type: String,
   default: '',
 },
 employee_name: {
   type: String,
   default: ''
 },
 expenses : [
  {
    expense_reason: {
      type: String,
      default: ''
    },
    expense_amount: {
      type: String,
      default: ''
    }
  }
],
 createdOn :{
   type:Date,
   default:""
 }
})


mongoose.model('employeeExpense', employeeExpenseSchema);