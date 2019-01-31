const config ={
    db:{
        host: '127.0.0.1',
        user: 'x',
        password: 'x',
        database:'domestico'
    },
    sessionOptions : {
        secret: 'config.sessionSecret',
        resave: false,
        saveUninitialized: true
    }
 }
 
 module.exports = config