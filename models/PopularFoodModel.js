const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let popularFoodSchema = new Schema(
    {

        food_id:{
            type:String,
            default: '',
            index: true,
            unique: true
        },
        food_name: {
            type:String,
            default:''
        },
        food_type: {
            type:String,
            default: ''
        },

        price: {
            type:Number,
            default:null
        },

        createdOn :{
            type:Date,
            default:''
          }
    }
)

mongoose.model('popularFood', popularFoodSchema);