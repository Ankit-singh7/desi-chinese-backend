
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
      type: String,
      default: ''
    },
    role: {
      type: String,
      default: '',
    },
    validationToken: {
      type: String,
      default: ''
    },
    documents: {
      aadhaar_url: String,
      pan_url: String,
      photo_url: String
    },

    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night'],
      default: 'Morning'
    },
    salary: {
      type: Number,
      default: null
    },
    designation: {
      type: String,
      default: ''
    },
    createdOn: {
      type: Date,
      default: ""
    },
    shift_time: {
      type: String,
      default: ''
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


mongoose.model('User', userSchema);