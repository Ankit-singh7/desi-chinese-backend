
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let branchSchema = new Schema(
 {
 branch_id: {
   type: String,
   default: '',
   index: true,
   unique: true
 },
 branch_name: {
   type: String,
   default: ''
 },
 branch_address: {
   type: String,
   default: ''
 },
 branch_phone:{
   type:String,
   default:''
 },
 branch_start_timing:{
   type: String,
   default:''
 },
 branch_end_timing:{
  type: String,
  default:''
 },
 branch_gst:{
  type: String,
  default:''
 },
 footer_1:{
  type: String,
  default:''
 },
 footer_2:{
  type: String,
  default:''
 },
 footer_3:{
  type: String,
  default:''
 },
 google_link:{
  type: String,
  default:'' 
 },
 facebook_link:{
  type: String,
  default:'' 
 },
 createdOn :{
   type:Date,
   default:""
 }, 
})


mongoose.model('branch', branchSchema);