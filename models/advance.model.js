// advance.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let advanceSchema = new Schema({

  advance_id: {
    type: String,
    unique: true,
    index: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  branch_id: {
    type: String,
    default: ''
  },

  amount: {
    type: Number,
    required: true,
    default: 0
  },

  month: {
    type: String, // "YYYY-MM"
    required: true,
    index: true
  },

  reason: {
    type: String,
    default: ''
  },

  added_by: {
    type: String, // admin_id
    default: ''
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }

});

advanceSchema.index({ employee_id: 1, month: 1 });
advanceSchema.index({ branch_id: 1, month: 1 });

mongoose.model('advance', advanceSchema);