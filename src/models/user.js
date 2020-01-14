const mongoose = require("mongoose")
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task.js')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        require: true,
        trim: true,
        lowercase: true,
        unique: true,

        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("email is invalidate")
            }
        }
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("Password cannot include 'password' ")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error('age must be a positive number')
            }
        }
    },
    tokens:[{
        token:{
            type: String,
            required: true,
        },
    }],
    avatar:{
        type: Buffer
    }
}, {
    timestamps: true
})


userSchema.virtual('tasks',{
    ref: Task,
    localField:'_id',
    foreignField:'owner',
})

userSchema.set('toJSON', { virtuals: true });

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    // to hide the password, tokens and avatar(avatar value is too large)
    // when user looks for their data
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// methods are accesible on the instances (instance methods)
userSchema.methods.generateAuthToken = async function (){
    const user = this
    const token = await jwt.sign({_id:user._id.toString()},'thisisatest')
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

// static are accesible on the model (model methods)
userSchema.statics.findByCredentials = async(email,password)=>{
    const user = await User.findOne({email})
    if(!user){
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    // dont want to let someone have more information on credentials, generic error is better
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

// hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    // check to see if password is modified before hashing
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})

// cascade delete all the tasks attached to this user
// own refference, pre/post hooks only work on built in functions
userSchema.pre('remove' , async function (next) {
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})


const User = mongoose.model('User', userSchema)
module.exports = User