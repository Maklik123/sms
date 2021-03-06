const express = require('express')
const next = require('next')
const bodyParser = require('body-parser')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const mongoose = require('mongoose')
const passportConf = require('./config/passport')
const MongoStore = require('connect-mongo')(session)
const secret = require('./config/secret')
const User = require('./models/user')
const Student = require('./models/student')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()


  //DATABASE CONNECTION
  mongoose.connect(secret.database,function(err){
    if(err){console.log(err);}
    else{console.log('DATABASE CONNECTED')}
  })

app.prepare()
.then(() => {
  const server = express()

  //MIDDLEWARE
  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({extended: false}))
  server.use(cookieParser())
  server.use(session({
    secret: process.env.SESSION_SECRET || secret.key,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({url:secret.database})
  }))
  server.use(passport.initialize())
  server.use(passport.session())

  server.get('/', (req, res) => {
    if(req.user){
      return app.render(req, res, '/index', req.query)
    }else{
      res.redirect('/login');
    }
  })

  server.get('/login', (req,res) => {
    return app.render(req,res, '/login', req.query);
  })

  server.post('/login', passport.authenticate('local',{failureRedirect: '/login'}), (req,res) => {
    res.redirect('/')
  })

  server.get('/signup', (req,res) => {
    return app.render(req,res, '/signup', req.query);
  })

  server.post('/signup', (req,res) => {
    var user = new User();

    user.username = req.body.username;
    user.password = req.body.password;
    user.email = req.body.email;

    User.findOne({email:req.body.email}, function(err,existingUser,next){
      if(err){return next(err)}
      if(existingUser){
        res.redirect('/signup');
      }else{
        user.save(function(err,user){
          if(err) {console.log(err);}
          res.redirect('/login');
        })
      }
    })
  })

  server.get('/finance', (req,res) => {
    if(req.user){
      return app.render(req, res, '/finance', req.query)
    }else{
      res.redirect('/login');
    }
  })

  server.get('/addstudent', (req,res) => {
    if(req.user){
      return app.render(req,res, '/addchallan', req.query)
    }else{
      res.redirect('/login')
    }
  })

  server.post('/addchallan', (req,res) => {
    var student = new Student();

    student.fname = req.body.fname;
    student.lname = req.body.lname;
    student.grade = req.body.grade;
    student.guardian = req.body.guardian
    student.amount = req.body.amount;
    student.gender = req.body.genderRadio;
    student.issueDate = req.body.issueDate;
    student.dueDate = req.body.dueDate;
    student.feeMonth = req.body.feeMonth;
    student.amount = req.body.amount;
    student.rollNo = req.body.rollNo;

    student.save(function(err,student){
      if(err) {console.log(err);}
      else{res.redirect('/finance')}

    })

  })
  var Query_RollNo='';
  server.get('/generatechallan',(req,res)=>{
    if(req.user){
         Query_RollNo= req.query.rollNo;

      return app.render(req,res,'/generatechallan',req.query)
    }else{
      res.redirect('/login')
    }
  })

  server.get('/allstudents', (req,res) => {
    if(req.user){
      Student.find({}, function(err,student,done){
        if(err){return done(err)}
        else{
          res.json(student);
        }
      }).catch((err)=>{
        console.log(err);
      });
    }else{
      res.redirect('/')
    }
  })
  server.get('/Send_ChallanData',(req,res)=>{
    if(req.user){
      Student.find({rollNo : Query_RollNo}, function(err,student,done){
        if(err){return done(err)}
        else{
          res.json(student);
        }
      }).catch((err)=>{
        console.log(err);
      });
    }else{
      res.redirect('/')
    }
  })


  server.get('/logout', (req,res) => {
    req.logout();
    res.redirect('/login');
  })

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(process.env.PORT || secret.port, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
