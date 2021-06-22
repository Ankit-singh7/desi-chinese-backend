const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let paymentModeSchema = new Schema(
    {
               payment_mode_id: {
                    type: String,
                    default: '',
                    index: true,
                    unique: true
                },
                payment_mode_name:{
                    type: String,
                    default: ''
                }            
    }
)

mongoose.model('paymentMode', paymentModeSchema);