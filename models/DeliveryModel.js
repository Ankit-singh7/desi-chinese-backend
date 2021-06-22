const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let deliveryModeSchema = new Schema(
    {
               delivery_mode_id: {
                    type: String,
                    default: '',
                    index: true,
                    unique: true
                },
                delivery_mode_name:{
                    type: String,
                    default: ''
                },
                is_banking:{
                    type: String,
                    default: 'false'
                }          
    }
)

mongoose.model('deliveryMode', deliveryModeSchema);