const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let billSchema = new Schema(
    {

        bill_id:{
            type: String,
            default: '',
            index: true,
            unique: true
        },
        user_name: {
          type:String,
          default:''
        },
        customer_name: {
            type:String,
            default:''
        },
        customer_phone: {
            type:Number,
            default:null
        },
        customer_address: {
            type: String,
            default:''
        },
        payment_mode: {
            type:String,
            default:''
        },
        delivery_mode: {
            type:String,
            default:''
        },
        total_price: {
            type: Number,
            default:null
        },
        products: [
            {
                food_name:{
                    type:String,
                    default:''
                },
                food_id: {
                    type:String,
                    default:''
                },
                quantity: {
                    type: Number,
                    default:null
                },
                price: {
                    type: Number,
                    default:null
                }
            }
        ],
        createdOn :{
            type:Date,
            default:''
          }
    }
)

mongoose.model('bill', billSchema);
