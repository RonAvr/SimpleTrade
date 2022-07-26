const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Portfolio = require('./portfolio')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase:true,
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }      
    },
    password: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        minlength: 5,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("The password contains the word 'password'")
            }
        }
    },
    available_cash: {
        type: Number,
        default: process.env.START_CASH
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

userSchema.virtual('portfolio', {
    ref: 'Portfolio',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id:user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function(next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete the user portfolio when he delete the account
userSchema.pre('remove', async function(next) {
    const user = this
    await Portfolio.deleteMany({ owner: user._id })
    next()
})

userSchema.methods.createPortfolio = async function(next) {
    const user = this
    const portfolio = new Portfolio({"owner":user._id})
    await portfolio.save()
    return portfolio
}

userSchema.methods.getPortfolio = async function(next) {
    const user = this
    const portfolio = Portfolio.findOne({"owner":user._id})
    return portfolio
}

const User = mongoose.model('User', userSchema)

module.exports = User