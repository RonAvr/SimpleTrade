const mongoose = require('mongoose')
const validator = require('validator')

const portfolioSchema =  new mongoose.Schema({
    stocks: [{
        symbol:{
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    portfolioValue: {
        type: Number,
        default: 0
    },
    orderbook: [{
        symbol: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        orderType: {
            type: String
        },
        time: {
            type: Date,
            default: Date.now
        }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    interest: {
        type: Number,
        default: 1
    },

}, {
    timestamps: true
})

const Portfolio = mongoose.model('Portfolio', portfolioSchema)

module.exports = Portfolio