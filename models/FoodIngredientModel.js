const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let foodIngredientSchema = new Schema(
    {

        food_ingredient_id: {
            type: String,
            default: '',
            index: true,
            unique: true
        },
        sub_category_id: {
            type: String,
            default: ''
        },

        ingredient_id: {
            type: String,
            default: ''
        },
        category: {
            type: String,
            default: ''
        },
        category_id: {
            type: String,
            default: ''
        },
        ingredient: {
            type: String,
            default: ''
        },
        unit_id: {
            type: String,
            default: ''
        },
        unit: {
            type: String,
            default: ''
        },
        quantity: {
            type: String,
            default: ''
        }
        ,
        createdOn: {
            type: Date,
            default: ''
        }
    }
)

mongoose.model('foodIngredient', foodIngredientSchema);
