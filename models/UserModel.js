
const mongoose = require('mongoose');
 const Schema = mongoose.Schema;
 
let userSchema = new Schema(
  {
  userId: {
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
  mobileNumber: {
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

  status: {
    type:String,
    default:''
  },
  role:{
    type:String,
    default:'',
  },
  validationToken: { //will generate automatically while resetting password
    type: String,
    default: ''
  },

  createdOn :{
    type:Date,
    default:""
  }

  
})


mongoose.model('User', userSchema);