const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const portfolioRouter = require('./routers/portfolio')
const cors = require('cors')

const app = express()
const port = process.env.PORT
app.use(cors())

// Enable CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

var corsOptions = {
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'] };
app.use(cors(corsOptions));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// parse application/json
app.use(express.json())
app.use(userRouter)
app.use(portfolioRouter)

module.exports = app