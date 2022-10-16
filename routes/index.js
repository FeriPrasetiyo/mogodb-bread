var express = require('express');
var router = express.Router();
var moment = require('moment')

/* GET home page. */
module.exports = function (db) {
  router.get('/', function (req, res,) {
    const url = req.url == '/' ? '/?page=1' : req.url;
    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    const posisi = []
    const values = []
    var count = 1;

    const filter = `&idCheck=${req.query.idCheck}&id=${req.query.id}&stringCheck=${req.query.stringCheck}&string=${req.query.string}&integerCheck=${req.query.integerCheck}&integer=${req.query.integer}&floatCheck=${req.query.floatCheck}&float=${req.query.float}&dateCheck=${req.query.dateCheck}&startDate=${req.query.startDate}&endDate=${req.query.endDate}&booleanCheck=${req.query.booleanCheck}&boolean=${req.query.boolean}`
    console.log(filter)

    var sortBy = req.query.sortBy == undefined ? `id` : req.query.sortBy;
    var sortMode = req.query.sortMode == undefined ? `asc` : req.query.sortMode;


    if (req.query.id && req.query.idCheck == 'on') {
      posisi.push(`id = $${count++}`);
      values.push(req.query.id);
    }

    if (req.query.string && req.query.stringCheck == 'on') {
      posisi.push(`strings like '%' || $${count++} || '%'`);
      values.push(req.query.string);
    }

    if (req.query.integer && req.query.integerCheck == 'on') {
      posisi.push(`integers like '%' || $${count++} || '%'`)
      values.push(req.query.integer);
    }

    if (req.query.float && req.query.floatCheck == 'on') {
      posisi.push(`floats like '%' || $${count++} || '%'`)
      values.push(req.query.float);
    }

    if (req.query.dateCheck == 'on') {
      if (req.query.startDate != '' && req.query.endDate != '') {
        posisi.push(`dates BETWEEN $${count++} AND $${count++}`)
        values.push(req.query.startDate);
        values.push(req.query.endDate);
      }
      else if (req.query.startDate) {
        posisi.push(`dates > $${count++}`)
        values.push(req.query.startDate);
      }
      else if (req.query.endDate) {
        posisi.push(`dates < $${count++}`)
        values.push(req.query.endDate);
      }
    }

    if (req.query.boolean && req.query.booleanCheck == 'on') {
      posisi.push(`booleans = $${count++}`);
      values.push(req.query.boolean);
    }


    let sql = 'SELECT COUNT(*) AS total FROM users';
    if (posisi.length > 0) {
      sql += ` WHERE ${posisi.join(' AND ')}`
    }

    db.query(sql, values, (err, data) => {
      if (err) {
        console.error(err);
      }
      const pages = Math.ceil(data.rows[0].total / limit)
      sql = 'SELECT * FROM users'
      if (posisi.length > 0) {
        sql += ` WHERE ${posisi.join(' AND ')}`
      }
      sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT $${count++} OFFSET $${count++}`;

      console.log('sql', sql)
      db.query(sql, [...values, limit, offset], (err, data) => {
        if (err) {
          console.error(err);
        }
        res.render('index', { data: data.rows, pages, page, query: req.query, moment, url, filter, sortBy, sortMode })
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