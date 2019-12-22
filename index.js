const path = require('path');
const fs = require('fs');
const express = require('express');
const expressHbs = require('express-handlebars');
const bodyParser = require('body-parser');
const ip = require('ip');
const encrypt = require('bcrypt');
const session = require('express-session');
const dbSession = require('express-mysql-session');
const app = express();
const PORT = process.env.PORT || 5000;
const host = ip.address();
const db = require(path.join(__dirname, 'util', 'database'));
const store = new dbSession({}, db);
app.engine('hbs', expressHbs({ extname: '.hbs', defaultLayout: 'main', layoutsDir: path.join(__dirname, 'views', 'layouts') }));
app.set('view engine', 'hbs');
app.set('views', 'views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));
app.use((req, res, next) => {
    res.locals.loggedIn = req.session.isLoggedIn;
    next();
});
app.get('/', (req, res, next) => {
    console.log('HI:=>' + req.session.isLoggedIn);
    res.render('home', { title: 'HOME', homePage: true });
});
app.get('/home', (req, res, next) => {
    res.redirect('/');
})
app.get('/contact', (req, res, next) => {
    res.status(200).render('contactus', { title: 'Contact Us', contactPage: true, form: true });
})
app.get('/signup', (req, res, next) => {
    res.status(200).render('signup', { title: 'Sign Up', signupPage: true, form: true });
});
app.post('/signup', (req, res, next) => {
    db.execute('select * from record where email=?', [req.body.email])
        .then((rows) => {
            if (!rows[0][0]) {
                let pass = req.body.password;
                encrypt.hash(pass, 12)
                    .then(pass => {
                        db.execute('insert into record values(?,?,?,?,?,?,?)', [req.body.email, pass, req.body.fname, req.body.lname, req.body.type == '1', req.body.gender, req.body.contact])
                            .then(() => { res.redirect('/'); })
                            .catch(err => { console.log('ERR:' + err) });
                    })
                    .catch(err => { console.log('ERR:' + err) });
            } else {
                console.log('Record already exists');
                res.redirect('/signup');
            }
        })
});
app.get('/login', (req, res, next) => {
    res.status(200).render('login', { title: 'LogIn', loginPage: true, form: true });
});
app.post('/login', (req, res, next) => {
    db.execute('select * from record where email=? and type=?', [req.body.email, req.body.login])
        .then((rows) => {
            if (rows[0][0]) {
                encrypt.compare(req.body.password, rows[0][0].password)
                    .then((matched) => {
                        if (matched) {
                            req.session.isLoggedIn = true;
                            req.session.user = req.body.email;
                            req.session.save((err) => {
                                console.log('Error save' + err);
                                res.redirect('/dashboard');
                            });
                        } else {
                            console.log('Not Matched');
                            res.redirect('/login');
                        }
                    })
                    .catch(err => { res.redirect('/login'); });
            } else
                res.redirect('/login');
        })
        .catch(err => { console.log('ERR:' + err) });
});
app.get('/logout', (req, res, next) => {
    req.session.isLoggedIn = false;
    req.session.user = null;
    req.session.save(() => {
        res.redirect('/');
    });
});

app.get('/dashboard', (req, res, next) => {
    if (!req.session.isLoggedIn)
        res.redirect('/login');
    else {
        res.render('dashboard', { title: 'Dashboard', dashboard: true });
    }
});
app.get('/profile/:uname', (req, res, next) => {
    console.log(req.params.uname);
    let user = req.params.uname;
    db.execute('select * from record where email=?', [user])
        .then(rows => {
            res.render('profile', { data: rows[0][0], dashboard: true, profile: true });
        })
        .catch(err => { console.log(err) })
})
app.get('/myprofile', (req, res, next) => {
    if (!req.session.isLoggedIn)
        res.redirect('/login');
    else {
        let user = req.session.user;
        db.execute('select * from record where email=?', [user])
            .then(rows => {
                res.render('profile', { dashboard: true, data: rows[0][0], profile: true });
            })
            .catch(err => { console.log(err); });
    }
});
app.get('/myquestions', (req, res, next) => {
    if (!req.session.isLoggedIn)
        res.redirect('/login');
    else {
        let user = req.session.user;
        db.execute('select * from record r, questions q where r.email=? and r.email=q.askedby order by num', [user])
            .then(rows => {
                res.render('questions', { dashboard: true, data: rows[0], size: rows[0].length > 0, questions: true });
            })
            .catch(err => { console.log(err) })
    }
})
app.use((req, res, next) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});
app.listen(PORT, host, () => { console.log('Server running on ' + host + ':' + PORT); });