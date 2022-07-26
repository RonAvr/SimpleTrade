const request = require('request')

const getData = async function(symbol, range) {

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_${range}&symbol=${symbol}&interval=1min&apikey=${process.env.STOCK_API}`

  let ans = {
    "time":[],
    "price":[]
  }
  
  return new Promise(function (resolve, reject) {
    request.get({
      url: url,
      json: true,
      headers: {'User-Agent': 'request'}
    }, async (err, res, rawData) => {
      if (err) {
        reject(err)
      } else if (res.statusCode !== 200) {
        reject(res)
      } else {
        
        // If there is an error rejecting the function call
        if(rawData['Error Message']){
          error = rawData['Error Message']
          return reject({error})
        }

        if(!rawData){
          return reject({'error':'Data is undefined'})
        }
        // Taking the rawdata, adding the timestamp and the open orice of each one of the entrie to the array
        rawData = rawData[Object.keys(rawData)[1]]
        Object.entries(rawData).map(item => {
          time = item[0]
          timestamp = Date.parse(item[0])
          price = item[1][Object.keys(item[1])[0]]
          // ans = ans.concat({time, price})
          ans['time'] = ans['time'].concat(time)
          ans['price'] = ans['price'].concat(price)
        })
        resolve(ans)
      }
  });
  })
}

module.exports = getData