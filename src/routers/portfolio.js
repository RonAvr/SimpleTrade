const express = require('express')
const auth = require('../middleware/auth')
const Portfolio = require('../models/portfolio')
const router = new express.Router()
const User = require('../models/user')
const getData = require('../utils/get_data')
const { webGetQuote } = require('../utils/web_quote')

// Buying a stock method
router.patch('/portfolio/buy', auth, async (req, res) => {
    orderType = 'buy'
    symbol = req.body.symbol
    price = req.body.price
    quantity = req.body.quantity
    actualPrice = await webGetQuote(symbol)
    user = req.user

    // Making sure the buy price is actually the right price in the market
    if (price < 0.98 * actualPrice || price > 1.02 * actualPrice)
        return res.status(400).send({'error':'Invalid price'})

    // Checking if there is enought available money
    if (user.available_cash < price * quantity)
        return res.status(400).send({'error':'You dont have enough money'}) 

    try {
        const portfolio = await Portfolio.findOne({"owner":user._id})

        stockToBuy = portfolio.stocks.find(stock => stock.symbol == symbol);

        // Removing the money from cash and adding it to the portfolio value
        user.available_cash -= price * quantity
        portfolio.portfolioValue += price * quantity

        // if the user already has this stock it updates it
        if (stockToBuy){
            stockToBuy.price = (stockToBuy.quantity * stockToBuy.price + price * quantity) / (stockToBuy.quantity + quantity)
            stockToBuy.quantity += quantity
        }
        // if the user doesnt have this stock it create a stock object and add it to the stocks array
        else{
            portfolio.stocks = portfolio.stocks.concat({symbol, price, quantity})
        }

        // adding the order to the orderbook
        portfolio.orderbook = portfolio.orderbook.concat({symbol, price, quantity, orderType})
        
        await user.save()
        await portfolio.save()
        res.send({user, portfolio})
    } catch (error) {
        res.send(error)
    }
})

// Selling a stock method
router.patch('/portfolio/sell', auth, async (req, res) => {
    orderType = 'sell'
    symbol = req.body.symbol
    price = req.body.price
    quantity = req.body.quantity
    actualPrice = await webGetQuote(symbol)
    user = req.user

    // Making sure the sell price is actually the right price in the market
    if (price < 0.98 * actualPrice || price > 1.02 * actualPrice)
        return res.status(400).send({'error':'Invalid price'})

    try {
        // getting the user portfolio
        const portfolio = await Portfolio.findOne({"owner":user._id})

        // getting the stock the user is trying to sell from the portfolio
        stockToSell = portfolio.stocks.find(stock => stock.symbol == symbol);
        
        // if the user doesnt have this stock
        if (!stockToSell)
            return res.status(400).send({'error':'You dont own this stock'})
        // if the user doesnt have enough quantity from this stock
        if (stockToSell.quantity < quantity)
            return res.status(400).send({'error':'You dont have this many shares'})

        // adding the order to the orderbook
        portfolio.orderbook = portfolio.orderbook.concat({symbol, price, quantity, orderType})

        // adding the order value to avaliable cash, taking it from the porfolio value, and updating the portfolio interest
        user.available_cash += price * quantity
        portfolio.portfolioValue -= stockToSell.price * quantity
        portfolio.interest = portfolio.interest * ( portfolio.portfolioValue + user.available_cash ) / process.env.START_CASH 

        // if the user sells all the shares he has
        if (stockToSell.quantity === quantity){
            portfolio.stocks = portfolio["stocks"].filter(stock => stock.symbol != symbol);
        } else {
            stockToSell.quantity -= quantity
        }

        await user.save()
        await portfolio.save()
        res.send({user, portfolio}  )

    } catch (error) {
        res.send(error)
    }
})

// Getting the protfolio
router.get('/portfolio/me', auth, async (req, res) => {
    const portfolio = await Portfolio.findOne({"owner":req.user._id})
    res.send(portfolio)
})

//Getting stock price using web scrapping
router.get('/portfolio/symbol/:symbol' , auth, async (req, res) => {

    if(!req.params.symbol){
        error = "Please send a symbol"
        return res.send({error})
    }

    try {
        currentPrice = await webGetQuote(req.params.symbol.toUpperCase())

        if (!currentPrice) {
            return res.status(400).send({'error':"Wasn't able to get a quote for that symbol"})
        }

        res.send({currentPrice})
    } catch (error) {
        res.send({error})
    }
})

// Getting data of stocks
router.get('/portfolio/data', auth, async (req, res) => {
    available_ranges = ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY']

    if ( !req.query.symbol || !req.query.range){
        return res.send({'error':'Bad request, needs symbol and range'})
    }
    
    // Checking if the input of the range is correct
    if (!available_ranges.includes(req.query.range)){
        return res.send({'error':'Range not available'})
    }

    try {
        data = await getData(req.query.symbol, req.query.range)
        
        if (!data) {
            error = "Wasn't able to get a quote for that symbol"
            return res.status(400).send({error})
        }
        res.send({data})
    } catch (error) {
        res.send({error})
    }

})

// Examples:
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortyBy=createdAt:desc

//Getting the leaderboard list
router.get('/portfolio' , auth, async (req, res) => {

    if(!req.query.sortBy){
        error = "Please send a sorting method"
        return res.send({error})
    }

    try{
        var loop = async function(){
            Portfolio.find({}).sort([['interest', -1]]).exec(async function(err, docs) {
                const ans = await Promise.all(
                    docs.map(async(port) => {
                       const user = await User.findById(port.owner)
                       interest = port.interest
                       username = user.username
                       return {username, interest}
                    })
                ) 
                res.send(ans)
         })}()
    } catch (error) {
        res.send(error)
    }

})

module.exports = router