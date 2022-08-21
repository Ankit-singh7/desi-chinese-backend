const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DiscountSchema = new Schema({
  discount_id: {
    type: String,
    default: '',
    index: true
  },
  discount: {
    type: Number,
    default:0
  },
  SGST: {
    type: Number,
    default:0
  },
  CGST: {
    type: Number,
    default:0
  },
  last_updated: {
    type:Date,
    default:''
  }
})

 mongoose.model('discount', DiscountSchema)