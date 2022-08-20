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
  }
})

 mongoose.model('discount', DiscountSchema)