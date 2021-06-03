const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const totalSchema = new Schema({
  total_id: {
    type: Number,
    default:0
  },
  total: {
    type: Number,
    default:0
  },
  createdOn :{
    type:String,
    default:''
  },
  payment_mode : {
    type: String,
    default:''
  },
  delivery_mode: {
   type: String,
   default:''
  }
})

 mongoose.model('total', totalSchema)