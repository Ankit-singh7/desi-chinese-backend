const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ingredientCategorySchema = new Schema(
    {
        ingredient_category_id: {
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

mongoose.model('ingredientCategory', ingredientCategorySchema);