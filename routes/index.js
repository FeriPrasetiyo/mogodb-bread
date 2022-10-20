var express = require('express');
var router = express.Router();
var moment = require('moment')

/* GET home page. */
module.exports = function (db) {
  router.get('/', async function (req, res,) {
    const url = req.url == '/' ? '/?page=1' : req.url;
    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    const wheres = {}
    const filter = `&idCheck=${req.query.idCheck}&id=${req.query.id}&stringCheck=${req.query.stringCheck}&string=${req.query.string}&integerCheck=${req.query.integerCheck}&integer=${req.query.integer}&floatCheck=${req.query.floatCheck}&float=${req.query.float}&dateCheck=${req.query.dateCheck}&startDate=${req.query.startDate}&endDate=${req.query.endDate}&booleanCheck=${req.query.booleanCheck}&boolean=${req.query.boolean}`
    var sortBy = req.query.sortBy == undefined ? 'strings' : req.query.sortBy;
    var sortMode = req.query.sortMode == undefined ? 1 : req.query.sortMode;
    var sortMongo = JSON.parse(`{"${sortBy}" : ${sortMode}}`);

    if (req.query.string && req.query.stringCheck == 'on') {
      wheres["strings"] = new RegExp(`${req.query.string}`, 'i')
    }

    if (req.query.integer && req.query.integerCheck == 'on') {
      wheres['integers'] = parseInt(req.query.integer)
    }

    if (req.query.float && req.query.floatCheck == 'on') {
      wheres['floats'] = JSON.parse(req.query.float)
    }

    if (req.query.dateCheck == 'on') {
      if (req.query.startDate != '' && req.query.endDate != '') {
        wheres['dates'] = { $gte: new Date(`${req.query.startDate}`), $lte: new Date(`${req.query.endDate}`) }
      }
      else if (req.query.startDate) {
        wheres['dates'] = { $gte: new Date(`${req.query.startDate}`) }
      }
      else if (req.query.endDate) {
        wheres['dates'] = { $lte: new Date(`${req.query.endDate}`) }
      }
    }

    if (req.query.boolean && req.query.booleanCheck == 'on') {
      wheres['booleans'] = req.query.boolean
    }


    const { rows } = await db.collection("users").find(wheres).toArray(function (err, result) {
      if (err) {
        console.error(err);
      }
      var total = rows.length;
      const pages = Math.ceil(total / limit)
      db.collection("users").find(wheres).skip(offset).limit(limit).collation({ 'locale': 'en' }).sort(sortMongo).toArray((err, data) => {
        if (err) {
          console.error(err)
        }
        res.render('index', { data, pages, page, filter, query: req.query, sortBy, sortMode, moment, url })
      })
    })
  })

  router.get('/add', (req, res) => {
    res.render('add')
  })

  router.post('/add', async (req, res) => {
    try {
      const { string, integer, float, date, boolean } = req.body
      const { rows: data } = await db.query('INSERT INTO users (strings, integers, floats, dates, booleans) VALUES ($1, $2, $3, $4, $5)', [string, parseInt(integer), parseFloat(float), date, JSON.parse(boolean)])
      res.redirect('/')
    } catch (err) {
      console.log(err)
      res.send(err)
    }
  })

  router.get('/delete/:id', async (req, res) => {
    try {
      const { id } = req.params

      const { rows: data } = await db.query('DELETE FROM users WHERE id = $1', [id])
      res.redirect('/')
    } catch (err) {
      res.send(err)
    }
  })

  router.get('/edit/:id', async (req, res) => {
    try {
      const { id } = req.params

      const { rows: data } = await db.query('SELECT * FROM users WHERE id = $1', [id])
      res.render('edit', { item: data[0], moment })
      console.log(data)

    } catch (err) {
      res.send(err)
    }
  })

  router.post('/edit/:id', async (req, res) => {
    try {
      const { id } = req.params
      console.log(req.params)
      const { strings, integers, floats, dates, booleans } = req.body
      await db.query('UPDATE users SET strings=$1, "integers"=$2, "floats"=$3, dates=$4, "booleans"=$5 WHERE id=$6', [strings, parseInt(integers), parseFloat(floats), dates, JSON.parse(booleans), id])

      res.redirect('/')
    } catch (err) {
      res.send(err)
    }
  })

  return router;
}