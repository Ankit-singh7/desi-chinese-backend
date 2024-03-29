const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ingredientReportSchema = new Schema(
    {
                date: {
                    type:String,
                    default:''
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
                quantity_by_order: {
                    type: Number,
                    default: null
                }
                ,
                quantity_by_stock: {
                    type: Number,
                    default: null
                },
                created_at: {
                    type:Date,
                    default:'' 
                }                  
    }
)

mongoose.model('ingredientReport', ingredientReportSchema);
