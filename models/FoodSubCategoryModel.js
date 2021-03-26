const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let foodSubCategorySchema = new Schema(
    {

        sub_category_id:{
            type:String,
            default: '',
            index: true,
            unique: true
        },
        category_id: {
            type:String,
            default: '',
            index: true,
            unique: true
        },
        name: {
            type:String,
            default:''
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

mongoose.model('foodSubCategory', foodSubCategorySchema);
