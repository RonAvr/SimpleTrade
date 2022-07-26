const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

// Creating a user and writing it to the database and generating a token - Checked
router.post('/users', async (req, res) => {

    const user = await new User(req.body)

    try{
        await user.save()
        const token = await user.generateAuthToken()

        const portfolio = await user.createPortfolio()
        
        res.status(201).send({user, token, portfolio})
    } catch (error) {
        if (error.errors?.email){
            return res.status(404).send({'error':'Email is invalid'})
        }
        if (error.errors?.password){
            return res.status(404).send({'error':'Password needs to contain at least 5 characters'})
        }
        if (error?.keyValue.username){
            return res.status(404).send({'error':'User name already taken'})
        }
        if (error?.keyValue.email){
            return res.status(404).send({'error':'Email is already taken'})
        }
        res.status(404).send({'error':'Something went wrong'})
    }
})

// Trying to login from the email and password input, using the static mathod of User class - Checked
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        const portfolio = await user.getPortfolio()
        res.send({user, token, portfolio})
    } catch (error) {
        return res.status(400).send({error:error.message})
    }

})

// Refreshing the page, need to get the user data agian
router.post('/users/refresh', async (req, res) => {

    if (!req.body || !req.body.token) {
        return res.send({'error':'Bad request, need token'})
    }

    try {
        const user = await User.findOne({"tokens.token":`${req.body.token}`})
        const portfolio = await user.getPortfolio()
        res.send({user, portfolio})
    } catch (error) {
        res.send({error})
    }

})

// Logging out the current user - Checked
router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        
        await req.user.save()

        res.send()

    } catch (error) {
        res.status(500).send(error)
    }

})

// Logging out from all the tokens - Checked
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save()

        res.send()

    } catch (error) {
        res.status(500).send()
    }
})

// Getting data of user - Checked
router.get('/users/me', auth, async (req, res) => {
    user = req.user
    const portfolio = await user.getPortfolio()
    res.send({user, portfolio})
})

// Updating the user's data - Checked
router.patch('/users/me', auth, async (req, res) => {
    valid_updates = ["password", "name"]
    const updates = Object.keys(req.body)
    isValid = updates.every((update) => valid_updates.includes(update))

    if(!isValid){
        return res.status(400).send('Invalid update field')
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (arror) {
        res.status(400).send(error)
    }  
})

// Deleting the current user - Checked
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router