const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const sessionSchema = new Schema({
  session_id: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  session_status: {
    type: String,
    default:''
  },
  session_amount: {
      type: Number,
      default:0
  },
  user_name: {
    type: String,
    default:''
  },
  withdrawn: {
      type:Number,
      default:0
  },
  isWithdrawn: {
      type: String,
      default: 'false'
  },
  cash_income: {
      type:Number,
      default: 0
  },
  drawer_balance: {
    type:Number,
    default: 0
  },
  createdOn: {
    type: Date
  }
})

 mongoose.model('session', sessionSchema)