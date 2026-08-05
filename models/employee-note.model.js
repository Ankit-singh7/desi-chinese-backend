const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let employeeNoteSchema = new Schema({

  note_id: {
    type: String,
    unique: true,
    index: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: ['PERFORMANCE', 'BEHAVIOUR', 'WARNING', 'GENERAL'],
    default: 'GENERAL'
  },

  content: {
    type: String,
    required: true
  },

  created_by: {
    type: String,
    default: ''
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }

});

employeeNoteSchema.index({ employee_id: 1, created_at: -1 });

mongoose.model('employee_note', employeeNoteSchema);
