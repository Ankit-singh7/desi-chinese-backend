const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const totalSchema = new Schema({
  total_id: {

  },
  total: {
    type: Number,
    default:0
  }
})

 mongoose.model('total', totalSchema)