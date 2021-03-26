const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let foodCategorySchema = new Schema(
    {

        category_id:{
            type: String,
            default: '',
            index: true,
            unique: true
        },
        name: {
            type:String,
            default:''
        },
        createdOn :{
            type:Date,
            default:''
          }
    }
)

mongoose.model('foodCategory', foodCategorySchema);
