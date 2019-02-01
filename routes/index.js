var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt-nodejs')
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

router.post('/setupProcess',function(req,res,next){
  console.log(req.body)
  const insertQuery = `INSERT INTO household (firstName, lastName, uid, email)
  VALUES (?,?,?,?)`
  connection.query(insertQuery,[req.body.firstName,req.body.lastName,req.session.uid,req.body.email],(error,results)=>{
    if (error){throw error}
    res.redirect('setup')
  })
})

router.post('/signupProcess', function(req, res, next) {
  const hashedPass = bcrypt.hashSync(req.body.password)
  const checkUserQuery = `SELECT * from users WHERE email = ?`
  connection.query(checkUserQuery,[req.body.email],(error,results)=>{
    if(error){throw error}
    if (results.length != 0){
      res.redirect('/')
      }else{
        const insertQuery = `INSERT INTO users (firstName, lastName, email, password)
  VALUES (?,?,?,?)`
  connection.query(insertQuery,[req.body.firstName,req.body.lastName, req.body.email, hashedPass],(error2,results2)=>{
    if (error2){throw error2}
    res.redirect('/')
      })
    }
  })
})

router.post('/setup', function(req,res,next){
  res.redirect('setup')
})

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Domestico' });
});

router.post('/loginProcess', function(req,res,next){
  const email = req.body.email
  const password = req.body.password
  const checkPasswordQuery = `SELECT * FROM users WHERE email = ?`
  connection.query(checkPasswordQuery,[email],(error,results)=>{
    if(error){throw error}
    if (results.length == 0){
      res.redirect('/')
    }else{
      const passwordsMatch = bcrypt.compareSync(password,results[0].password)
      if (!passwordsMatch){
        res.redirect('/')
      }else{
        req.session.name = results[0].firstName
        req.session.email = results[0].email
        req.session.uid = results[0].id
        req.session.loggedIn = true
        res.redirect('/login')
      }
    }
  })
})

router.get('/expenses', function(req, res, next) {
  res.render('expenses', { title: 'Domestico' });
});

router.post('/addExpense',function(req,res,next){
  const insertQuery = `INSERT INTO expenses (id,name, date, amount, uid)
  VALUES (DEFAULT,?,?,?,?)`
  connection.query(insertQuery,[req.body.name, req.body.date, req.body.amount, req.session.uid],(error,results)=>{
    if (error){throw error}
    res.redirect('expenses')
  })
})

module.exports = router;
