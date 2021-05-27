const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockOutSchema = new Schema(
    {

        stock_out_id: {
            type: String,
            default: '',
            index: true,
            unique: true
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

mongoose.model('stockOut', stockOutSchema);
