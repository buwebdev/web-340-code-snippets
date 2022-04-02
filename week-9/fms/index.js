const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const moment = require('moment');
const fs = require('fs');

// mongoose model imports
const Fruit = require('./models/fruit');
const User = require('./models/user');

const app = express();

app.engine('.html', require('ejs').__express);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true})); // needed to accept forms
app.use(express.json()); // needed to accept and return json objects

app.use(cookieParser()); // added in week 6
// added in week 6
app.use(session({
    secret: 's3cret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const PORT = 3000 || process.env.PORT;
const CONN = 'mongodb+srv://web340_user:admin@cluster0.lujih.mongodb.net/web340DB?retryWrites=true&w=majority'
const message = 'Welcome to the Fruit Management System';

mongoose.connect(CONN).then(() => {
    console.log('Connection to the database was successful');
}).catch(err => {
    console.log('MongoDB Error: ' + err.message);
})

app.use((req, res, next) => {
    if (req.session.passport) {
        console.log(req.session.passport.user);
        res.locals.currentUser = req.session.passport.user;
    } else {
        res.locals.currentUser = null;
    }
    next();
})

app.get('/', (req, res) => {
    let errorMessage = '';

    let fruits = Fruit.find({}, function(err, fruits) {
        if (err) {
            console.log(err)
            errorMessage = 'MongoDB Exception: ' + err;
        } else {
            errorMessage = null;
        }

        res.render('index', {
            title: 'FMS: Home',
            cardTitle: 'Fruit List',
            fruits: fruits,
            errorMessage: errorMessage,
            message: message
        })
    })
});

app.get('/api/fruits', async(req, res) => {
    Fruit.find({}, function(err, fruits) {
        if (err) {
            console.log(err);
        } else {
            res.json(fruits);
        }
    })
})

app.get('/fruit-details/:id', (req, res) => {
    Fruit.findOne({'_id': req.params.id}, function(err, fruit) {
        if (err) {
            console.log(err);
        } else {
            res.render('fruit-details', {
                title: 'FMS: Fruit Details',
                cardTitle: 'Fruit Details',
                fruit: fruit,
                message: message
            })
        }
    })
})

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'FMS: About',
        message: message,
        pageName: 'About Page'
    })
})

app.get('/contact', (req, res) => {
    let jsonFile = fs.readFileSync('./public/data/grocery-stores.json');
    let stores = JSON.parse(jsonFile);

    console.log(stores);

    res.render('contact', {
        title: 'FMS: Contact',
        message: message,
        pageName: 'Contact Page',
        cardTitle: 'Store Locations',
        stores: stores
    })
})

app.get('/register', (req, res) => {
    User.find({}, function(err, users) {
        if (err) {
            console.log(err);
        } else {
            res.render('register', {
                title: 'FMS: Register',
                message: message,
                cardTitle: 'Registration Form',
                moment: moment,
                users: users
            })
        }
    })
})

app.post('/register', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    User.register(new User({username: username}), password, function(err, user) {
        if (err) {
            console.log(err);
            return res.redirect('/register');
        }

        passport.authenticate("local")(
            req, res, function () {
                res.redirect('/register')
            });
    })
})

app.post('/fruits', (req, res) => {
    const fruitName = req.body.fruitName;

    console.log(req.body);
    let fruit = new Fruit({
        name: fruitName
    })

    Fruit.create(fruit, function(err, fruit) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    })
})

app.get('/login', (req, res) => {
    res.render('login', {
        title: 'FMS: Login',
        message: message,
        cardTitle: 'Login Form'
    })
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}), function (req, res) {
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})

app.listen(PORT, () => {
    console.log('Application started and listening on PORT ' + PORT);
});
