var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt-nodejs')
const mysql = require('mysql')
const config = require('../config')
let connection = mysql.createConnection(config.db)
connection.connect()

/* GET home page. */
router.get('/', function(req, res, next) {
  let msg = "";
  console.log(req.query.msg)
  if (req.query.msg == "badPassword"){
    msg = '<h2 class="text-warning">This password is not associated with this email. Please try again.</h2>'
  }else if(req.query.msg == "noEmail"){
    msg = '<h2 class="text-danger">This email is not registered in our system. Please try again or register!</h2>'
  }
  res.render('index', { title: 'Domestico', msg:msg});
  
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
    res.redirect('infoPage')
      })
    }
  })
})

router.post('/setup', function(req,res,next){
  res.redirect('setup')
})

router.get('/infoPage', function(req, res, next) {
  selectQuery = `SELECT max(t1.uid) as uid, max(count) as numberOfRoomates, max(firstname) as firstName, max(hid) as hid, max(amount) as amount, max(amount/count) as avgPrice FROM 
	(
		SELECT MAX(household.firstName) as firstname, SUM(expenses.amount) AS amount, max(household.id) as hid, ? as uid FROM household 
			INNER JOIN users ON household.uid = users.id 
			INNER JOIN expenses ON users.id = expenses.uid 
		WHERE users.id = ? 
		GROUP BY household.firstName
	) as t1 INNER JOIN (
		SELECT count(uid)+1 as count, ? as uid FROM household WHERE uid = ? GROUP BY uid
		) as t2 ON t2.uid = t1.uid
	GROUP BY firstname`;
  connection.query(selectQuery,[req.session.uid,req.session.uid,req.session.uid,req.session.uid],(error,results)=>{
    if(error){throw error}
    paymentQuery = `SELECT * FROM payments WHERE hid IN (SELECT household.id FROM household
      INNER JOIN users ON users.id = household.uid WHERE users.id = ?); `
      connection.query(paymentQuery,[req.session.uid],(error,results2,next)=>{
        results2.forEach((payment)=>{
          const payment1 = payment.amount
          const hid = payment.hid
          results.forEach((roommate, i)=>{
            if (roommate.hid == hid){
              results[i].avgPrice -= payment1
              // res.json(results)
            }
          })
        })
        res.render('infoPage', { title: 'Domestico', results: results });

      })
  })
});

router.post('/loginProcess', function(req,res,next){
  const email = req.body.email
  const password = req.body.password
  const checkPasswordQuery = `SELECT * FROM users WHERE email = ?`
  connection.query(checkPasswordQuery,[email],(error,results)=>{
    if(error){throw error}
    if (results.length == 0){
      console.log('FIRST CHECK')
      res.redirect('/?msg=noEmail')
    }else{
      const passwordsMatch = bcrypt.compareSync(password,results[0].password)
      if (!passwordsMatch){
        console.log('second check')
        res.redirect('/?msg=badPassword')
      }else{
        req.session.name = results[0].firstName
        req.session.email = results[0].email
        req.session.uid = results[0].id
        req.session.loggedIn = true
        res.redirect('/infoPage')
      }
    }
  })
})

router.get('/expenses', function(req, res, next) {
  selectQuery = `SELECT name, date, id, amount FROM expenses where uid=? ORDER BY (ID) DESC LIMIT 10` 
  connection.query(selectQuery,[req.session.uid,], (error,results)=>{
    if (error){throw error}
    res.render('expenses', { title: 'Domestico', results: results });
  })
})
  


router.post('/addExpense',function(req,res,next){
  const insertQuery = `INSERT INTO expenses (id,name, date, amount, uid)
  VALUES (DEFAULT,?,?,?,?);`
  connection.query(insertQuery,[req.body.name, req.body.date, req.body.amount, req.session.uid],(error,results)=>{
    if (error){throw error}
    res.redirect('expenses')
  })
})

router.get('/deleteExpense/:id',function(req,res,next){
  const removeQuery = `DELETE FROM expenses WHERE id=?;`
  connection.query(removeQuery,[req.params.id],(error,results)=>{
    if (error){throw error}
    res.redirect('/expenses')
  })
})

router.get('/payments', function(req,res,next){
  dropDownQuery=`SELECT household.firstName, household.id FROM household INNER JOIN users ON users.id = household.uid WHERE users.id = ?`
  connection.query(dropDownQuery,[req.session.uid],(error,results)=>{
    if (error){throw error}
    res.render('payments',{results:results})
  })
})

router.post('/addPayment', function(req,res,next){
  const insertQuery = `INSERT INTO payments (id, date, amount,hid)
  VALUES (DEFAULT,?,?,?)`
  connection.query(insertQuery,[req.body.date,req.body.amount,req.body.hid],(error,results)=>{
  if (error){throw error}
  res.redirect('payments')
  })
})

module.exports = router;
