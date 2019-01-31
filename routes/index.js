var express = require('express');
var router = express.Router();
const mysql = require('mysql')
const config = require('../config')
let connection = mysql.createConnection(config.db)
connection.connect()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Domestico' });
});

router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Domestico' });
});

router.get('/setup', function(req, res, next) {
  res.render('setup', { title: 'Domestico' });
});

router.post('/signupProcess', function(req, res, next) {
  const insertQuery = `INSERT INTO users (firstName, lastName, email, password)
  VALUES (?,?,?,?)`
  connection.query(insertQuery,[req.body.firstName,req.body.lastName, req.body.email, req.body.password],(error,results)=>{
    if (error){throw error}
    res.redirect('setup')
  })
});

router.post('/setup', function(req,res,next){
  res.redirect('setup')
})

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Domestico' });
});

router.get('/expenses', function(req, res, next) {
  res.render('expenses', { title: 'Domestico' });
});


module.exports = router;
