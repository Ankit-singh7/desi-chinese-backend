const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let departmentSchema = new Schema(
    {
        department_id: {
            type: String,
            default: '',
            index: true,
            unique: true
        },
        department_name: {
            type:String,
            default:''
        },
        createdOn :{
            type:Date,
            default:''
          }
    }
)

mongoose.model('department', departmentSchema);