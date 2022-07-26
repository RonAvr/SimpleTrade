const axios = require("axios");
const cheerio = require("cheerio");

const webGetQuote = async function(symbol){
  const url = `https://www.marketwatch.com/investing/stock/${symbol}`
  const fetchTitles = async () => {
    try {
      const response = await axios.get(url);

      const html = response.data;
      const $ = cheerio.load(html);
      const titles = [];
      let ans;

      $('.intraday__price ').each((_idx, el) => {
        ans = $(el).text().trim().split(' ')
        ans = ans[Object.keys(ans)[Object.keys(ans).length - 1]]
        });

      return ans
      
    } catch (error) {
      return error;
    }
  };

  ans = await fetchTitles()
  return (ans)

}

module.exports = {
  webGetQuote
}