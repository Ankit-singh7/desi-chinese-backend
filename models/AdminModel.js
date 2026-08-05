
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let adminSchema = new Schema(
 {
 adminId: {
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
 email: {
   type: String,
   default: ''
 },
 role:{
   type: String,
   deafault:''
 },
 validationToken: { //will generate automatically while resetting password
   type: String,
   default: ''
 },
 role:{
   type: String,
   default:''
 },
 createdOn :{
   type:Date,
   default:""
 },
  documents: {
      aadhaar_url: String,
      pan_url: String,
      photo_url: String
  },
  // Shiftly operator fields (optional — used by operator punch/profile)
  mobileNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active'
  },
  designation: {
    type: String,
    default: ''
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    default: 'Morning'
  },
  shift_time: {
    type: String,
    default: ''
  },
  salary: {
    type: Number,
    default: null
  },
  branch_id: {
    type: String,
    default: ''
  },
  branch_name: {
    type: String,
    default: ''
  }
})


mongoose.model('Admin', adminSchema);