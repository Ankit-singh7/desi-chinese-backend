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
        token_id:{
            type:String,
            default:'' 
        },
        bill_tracking_number: {
            type: Number,
            default: null
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
        customer_alternative_phone:{
            type:Number,
            default:null
        },
        customer_address: {
            type: String,
            default:''
        },
        dual_payment_mode:{
            type:String,
            default:''
        },
        payment_mode: {
            type:String,
            default:''
        },
        payment_mode_2: {
            type:String,
            default:''
        },
        split_amount_1:{
            type:Number,
            default:null
        },
        split_amount_2:{
            type:Number,
            default:null
        },
        delivery_mode: {
            type:String,
            default:''
        },
        total_price: {
            type: Number,
            default:null
        },
        status:{
            type:String,
            default:''
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
                department_id: {
                    type: String,
                    default: ''
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
        date:{
            type:String,
            default:''
        },
        printed:{
            type:String,
            default:''  
        },
        createdOn :{
            type:Date,
            default:''
          },
        incookAt: {
            type:Date,
            default:''
        },
        cookedAt:{
            type:Date,
            default:''
        },
        dispatchedAt: {
            type:Date,
            default:''
        }
    }
)

mongoose.model('bill', billSchema);
