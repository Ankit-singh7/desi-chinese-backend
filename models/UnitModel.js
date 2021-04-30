const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let unitSchema = new Schema(
    {
        unit_id: {
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

mongoose.model('unit', unitSchema);