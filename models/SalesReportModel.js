const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let salesReportSchema = new Schema(
    {
               sales_report_id: {
                    type: String,
                    default: '',
                    index: true,
                    unique: true
                },
                date: {
                    type: String,
                    default: ''
                },
                food_name: {
                    type: String,
                    default: ''
                },
                food_id: {
                    type: String,
                    default: ''
                },
                quantity: {
                    type: Number,
                    default: 0
                }
                              
    }
)

mongoose.model('salesReport', salesReportSchema);
