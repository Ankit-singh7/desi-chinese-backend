const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ingredientSchema = new Schema(
    {
        ingredient_id: {
            type: String,
            default: '',
            index: true,
            unique: true
        },
        category:{
            type: String,
            default: ''
        },
        category_id:{
            type: String,
            default: ''
        },
        name: {
            type:String,
            default:''
        },
        unit_id: {
            type: String,
            default:''
        },
        unit:{
            type: String,
            default:''
          },
          createdOn :{
            type:Date,
            default:''
          }
    }
)

mongoose.model('ingredient', ingredientSchema);