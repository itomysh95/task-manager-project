const mongoose = require("mongoose")


const taskSchema = mongoose.Schema({
        description: {
            type:String,
            required: true,
            trim: true,
        },
        completed_fields: {
            type: Boolean,
            required:false,
        },
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            // creates a reference to the User model
            ref: 'User'
        }
    },{
        timestamps: true
    }
)

const Tasks = mongoose.model('Tasks',taskSchema)


module.exports = Tasks