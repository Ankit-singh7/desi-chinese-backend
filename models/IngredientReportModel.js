const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ingredientReportSchema = new Schema(
    {
        date: {
            type: Date,
            default: ''
        },
        ingredient: [
            {
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
                }
            }
        ]
    }
)

mongoose.model('ingredientReport', ingredientReportSchema);
