var express = require('express');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/login_reg');
const flash = require('express-flash');
var session = require('express-session');
const bcrypt = require('bcrypt');
var app = express();
const emailRegex = require('email-regex');

var bodyParser = require('body-parser');

app.use(flash());
app.use(session({
    secret: 'keyboardkitteh',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  }))

app.use(bodyParser.urlencoded({ extended: true }));
var path = require('path');
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');


const UserSchema = new mongoose.Schema({
    email:{type: String, required:[true,'please enter a valid email']},
    first_name: {type:String, required:[true,'first_name is required']},
    last_name: {type: String, required:[true,'last_name is required']},
    password: {type: String, required:[true,'password is required']},
    birthday: {type: Date, required:[true,'birthday is required']}
},{timestamps: true})
mongoose.model('User', UserSchema);
const User = mongoose.model('User')

app.post('/register',function(req,res){
    console.log("POST DATA", req.body);

    if(emailRegex().test(req.body.email)!=true){
        console.log(checkunique(req.body.email));
        req.flash('register', "email is not valid.");
    //other validations here, including bcrypt for password
    }
    if(req.body.pw.length < 5 || req.body.pw!= req.body.pwConfirm){
        req.flash('register','passwords do not match.');
        res.redirect('/')
    }else{
        bcrypt.hash(req.body.pw,10,function(err,hashed_pw){
            if(err){

            }else{
                var user = new User({email: req.body.email,
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        password: hashed_pw,
                        birthday: req.body.birthday});
                user.save(function(err){
                    if(err){
                        console.log("Failed to create user");
                        for(var key in err.errors){
                            req.flash('register', err.errors[key].message);
                        }
                        res.redirect('/')
                    }else{
                        console.log("Successfully created User")
                        
                        User.findOne({email:req.body.email},function(err,user){
                            if(err){
                                console.log("cannot retrieve user");
                                res.redirect('/');
                            }
                            else{
                                console.log(user)
                                req.session.email = user.email;
                                res.redirect('/welcome')
                            }
                        })
                    }
                })
            }
        })
    }
    
    })

app.post('/login',function(req,res){
    console.log("POST DATA",req.body);
    if(req.body.email == null){
        console.log("null email");
        req.flash('login','fields cant be empty');
    }
    if(req.body.pw == null){
        console.log("null password");
        req.flash('login',"All fields are required")
    }
    if(emailRegex().test(req.body.email)!=true){
        console.log("incorrect email.");
        req.flash('login',"incorrect email")
        res.redirect('/')
    }else{
        User.findOne({email: req.body.email},function(err,user){
            if(err){
                console.log("no user exists with that email");
                res.redirect('/');
            }
            else{
                bcrypt.compare(req.body.pw, user.password, function(err,validpw){
                    if(err){
                        console.log("error");
                        req.flash('login', "incorrect password");
                        res.redirect('/');                        
                    }else if(validpw==false){
                        console.log("incorrect password");
                        req.flash('login', "incorrect password");
                        res.redirect('/');     
                    }else{
                        console.log(user.email);
                        req.session.email = user.email;
                        res.redirect('/welcome');
                    }
                })


                }
            }
        )}

})
app.get('/welcome',function(req,res){
    User.findOne({email:req.session.email},function(err,user){
        if(err){
            console.log("cannot retrieve user");
            res.redirect('/');
        }
        else{
            res.render('welcome', {user:user})
        }
    })
})

app.get('/logout',function(req,res){
    req.session.email = null;
    console.log("logging out")
    res.redirect('/')
})

app.get('/', function(req, res) {
    res.render('index')
})
  
app.listen(8000, function() {
    console.log("listening on port 8000");
})


function checkunique(email){
    User.find({email:email},function(err,user){
        if(err){
            console.log('something went wrong');
        }
        else{
            console.log(user)
            res.redirect('/')
        }
    })
}