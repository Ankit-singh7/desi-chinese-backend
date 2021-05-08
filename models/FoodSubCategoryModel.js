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
        category_name: {
            type:String,
            default:''
        },
        category_id: {
            type:String,
            default: ''
        },
        name: {
            type:String,
            default:''
        },
        price: {
            type:Number,
            default:null
        },
        type: {
            type: String,
            default:''
        },
        status: {
            type: String,
            default:''
        },
        createdOn :{
            type:Date,
            default:''
          }
    }
)

mongoose.model('foodSubCategory', foodSubCategorySchema);
