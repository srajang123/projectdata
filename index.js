const path = require('path');
const fs = require('fs');
const express = require('express');
const expressHbs = require('express-handlebars');
const bodyParser = require('body-parser');
const ip = require('ip');
const encrypt = require('bcrypt');
const session = require('express-session');
const dbSession = require('express-mysql-session');
const crypto = require('crypto');
const flash = require('connect-flash');
const send = require('./routes/mail');
const otp = require('./routes/otp');
var color = require('colors');
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
app.use(flash());
app.use((req, res, next) => {
    res.locals.loggedIn = req.session.isLoggedIn;
    next();
});
app.get('/', (req, res, next) => {
    res.render('home', { title: 'HOME', homePage: true });
});
app.get('/home', (req, res, next) => {
    res.redirect('/');
})
app.get('/contact', (req, res, next) => {
    res.status(200).render('contactus', { title: 'Contact Us', contactPage: true, form: true });
})
app.get('/signup', (req, res, next) => {
    res.status(200).render('signup', { title: 'Sign Up', signupPage: true, form: true, err: req.flash('error')[0] });
});
app.get('/about', (req, res, next) => {
    res.status(200).render('aboutus', { title: 'About Us', aboutPage: true });
})
app.post('/contact', (req, res, next) => {
    db.execute('insert into contactmsg values(?,?,?,?,?)', [req.body.firstname, req.body.lastname, req.body.email, req.body.phone, , req.body.message])
        .then(rows => {
            res.redirect('/');
        })
        .catch(err => console.log(err));
})
app.post('/signup', (req, res, next) => {
    db.execute('select * from record where email=?', [req.body.email])
        .then((rows) => {
            if (!rows[0][0]) {
                let pass = req.body.password;
                encrypt.hash(pass, 12)
                    .then(pass => {
                        db.execute('insert into record values(?,?,?,?,?,?,?)', [req.body.email, pass, req.body.fname, req.body.lname, req.body.type, req.body.gender, req.body.contact])
                            .then(() => { res.redirect('/'); })
                            .catch(err => { console.log('ERR:' + err) });
                    })
                    .catch(err => { console.log('ERR:' + err) });
            } else {
                req.flash('error', 'Record already Exists!');
                res.redirect('/signup');
            }
        })
});
app.get('/login', (req, res, next) => {
    let hi = req.flash('error')[0];
    res.status(200).render('login', { title: 'LogIn', loginPage: true, form: true, err: hi });
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
                            req.session.type = req.body.login;
                            req.session.save((err) => {
                                if (err) {
                                    ('Error save' + err);
                                }
                                res.redirect('/dashboard');
                            });
                        } else {
                            req.flash('error', 'Incorrect Password');
                            res.redirect('/login');
                        }
                    })
                    .catch(err => { res.redirect('/login'); });
            } else {
                req.flash('error', 'E-mail not found');
                res.redirect('/login');
            }
        })
        .catch(err => { console.log('ERR:' + err) });
});
app.get('/resetpass', (req, res, next) => {
    res.render('resetpass', { title: 'Reset Password', form: true });
})
app.get('/resetpass/:token', (req, res, next) => {
    const token = req.params.token;
    db.execute('select * from record where resetToken=? and resetTokenTime>?', [token, Date.now()])
        .then(rows => {
            rows = rows[0][0];
            if (!rows) {
                req.flash('error', 'Invalid Token');
                res.redirect('/login');
            } else {
                res.render('new-pass', { title: 'Change Password', form: true, token: token, user: rows.email });
            }
        })
        .catch(err => { console.log(err) });
});
app.post('/new-pass', (req, res, next) => {
    db.execute('select * from record where email=? and  resetToken=?', [req.body.user, req.body.token])
        .then(rows => {
            rows = rows[0][0];
            if (!rows || rows.resetTokenTime < Date.now()) {
                req.flash('error', 'Invald Token');
                res.redirect('/login');
            } else {
                encrypt.hash(req.body.password, 12)
                    .then(pass => {
                        db.execute('update record set password=?,resetToken=null,resetTokenTime=null where email=?', [pass, req.body.user])
                            .then(row => {
                                req.flash('error', 'Password Updated');
                                res.redirect('/login');
                            })
                            .catch(err => { console.log(err) });
                    })
                    .catch(err => { console.log(err) });
            }
        })
        .catch(err => console.log(err));
});
app.post('/resetpass', (req, res, next) => {
    db.execute('select * from record where email=?', [req.body.email])
        .then(rows => {
            if (rows[0][0]) {
                crypto.randomBytes(12, (err, buffer) => {
                    const token = buffer.toString('hex');
                    db.execute('update record set resetToken=?,resetTokenTime=? where email=?', [token, Date.now() + 3600000, req.body.email])
                        .then(rows => {
                            send.Mail(req.body.email, 'Password Reset Request', 'Click on the following link to reset your password:\n\t http://192.168.20.90:5000/resetpass/' + token);
                            res.redirect('/');
                        })
                        .catch(err => console.log(err));
                });
            } else {
                req.flash('error', 'E-mail not found');
                res.redirect('/resetpass');
            }
        })
        .catch(err => console.log(err));
});
app.get('/logout', (req, res, next) => {
    req.session.isLoggedIn = false;
    req.session.user = null;
    req.session.save(() => {
        res.redirect('/');
    });
});

app.get('/dashboard', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/login');
    } else {
        console.table(req.session);
        res.render('dashboard', { title: 'Dashboard', dashboard: true, student: req.session.type == 0 });
    }
});
app.get('/profile/:uname', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/login');
        return;
    }
    let user = req.params.uname;
    db.execute('select * from record where email=?', [user])
        .then(rows => {
            let tques = 0,
                tans = 0;
            db.execute('select count(*) as total from questions where askedby=?', [user])
                .then(rowa => {
                    rowa = rowa[0][0];
                    tques = rowa.total;
                    db.execute('select count(*) as tot from questions where askedby=? and ansby is not NULL', [user])
                        .then(rowb => {
                            tans = rowb[0][0].tot;
                            res.render('profile', { dashboard: true, student: req.session.student == 0, data: rows[0][0], profile: true, total: tques, totalans: tans, totalunans: (tques - tans), admin: req.session.admin });
                        })
                        .catch(err => { console.log(err) });
                })
                .catch(err => { console.log(err) });
        })
        .catch(err => { console.log(err) })
});
app.get('/myprofile', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/login');
    } else {
        let user = req.session.user;
        db.execute('select * from record where email=?', [user])
            .then(rows => {
                let tques = 0,
                    tans = 0;
                db.execute('select count(*) as total from questions where askedby=?', [user])
                    .then(rowa => {
                        rowa = rowa[0][0];
                        tques = rowa.total;
                        db.execute('select count(*) as tot from questions where askedby=? and ansby is not NULL', [user])
                            .then(rowb => {
                                tans = rowb[0][0].tot;
                                res.render('profile', { dashboard: true, student: req.session.type == 0, data: rows[0][0], profile: true, total: tques, totalans: tans, totalunans: (tques - tans) });
                            })
                            .catch(err => { console.log(err) });
                    })
                    .catch(err => { console.log(err) });
            })
            .catch(err => { console.log(err); });
    }
});
app.get('/questions', (req, res, next) => {
    if (req.session.isLoggedIn) {
        db.execute('select * from questions where answer is null')
            .then(rows => {
                rows = rows[0];
                res.render('questions', { title: 'Questions', size: rows.length > 0, data: rows, dashboard: true, student: req.session.type == 0, questions: true });
            })
            .catch(err => console.log(err));
    } else {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/login');
    }
});
app.get('/myquestions', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/login');
    } else {
        let user = req.session.user;
        db.execute('select * from record r, questions q where r.email=? and r.email=q.askedby order by num desc', [user])
            .then(rows => {
                console.table(rows[0]);
                res.render('myquestions', { title: 'Questions', dashboard: true, student: req.session.type == 0, data: rows[0], size: rows[0].length > 0, questions: true });
            })
            .catch(err => { console.log(err) })
    }
});
app.get('/myanswers', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/login');
    } else {
        let user = req.session.user;
        db.execute('select * from record r,questions q where r.email=? and r.email=q.ansby', [user])
            .then(rows => {
                res.render('answers', { title: 'Answers', dashboard: true, student: req.session.type == 0, data: rows[0], size: rows[0].length > 0, questions: true });
            })
            .catch(err => { console.log(err) })
    }
});
app.get('/newquestion', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to asd Questions');
        res.redirect('/login');
    } else if (req.session.type != 0) {
        req.flash('error', 'Please Login as student to add Question');
        res.redirect('/login');
    } else {
        res.render('newquestion', { title: 'New Question', form: true, student: req.session.type == 0, dashboard: true });
    }
});
app.post('/newquestion', (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.flash('error', 'Please LogIn to asd Questions');
        res.redirect('/login');
    } else if (req.session.type != 0) {
        req.flash('error', 'Please Login as student to add Question');
        res.redirect('/login');
    } else {
        db.execute('insert into questions values(?,?,null,?,null,?,null,?)', [req.body.subject, req.body.question, req.body.description, req.session.user, Date.now()])
            .then(rows => {
                res.redirect('/myquestions');
                console.log('done')
            })
            .catch(err => console.log(err));
    }
})
app.get('/admin', (req, res, next) => {
    if (req.session.admin && req.session.isAdminLoggedIn) {
        res.status(200).render('profile', { title: 'Admin', dashboard: true, admin: true });
    } else {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/admin/login');
    }
});
app.get('/admin/contactmsg', (req, res, next) => {
    if (req.session.admin && req.session.isAdminLoggedIn) {
        db.execute('select * from contactmsg')
            .then(rows => {
                rows = rows[0];
                res.status(200).render('admin-contactmsg', { title: 'Contact Us Messages', data: rows, admin: true, dashboard: true, size: rows.length > 0, msg: true });
            })
            .catch(err => { console.log(err) });
    } else {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/admin/login');
    }
});
app.post('/admin/contactmsg', (req, res, next) => {
    send.Mail(req.body.mail, 'Your Contact Us Message', req.body.reply);
});
app.get('/admin/myprofile', (req, res, next) => {
    if (req.session.admin && req.session.isAdminLoggedIn) {
        let total = 0,
            totalstudents = 0;
        db.execute('select * from admin where uname=?', [req.session.user])
            .then(rows => {
                rows = rows[0][0];
                db.execute('select count(*) as total from record')
                    .then(resp => {
                        total = resp[0][0].total;
                        db.execute('select count(*) as t from record where type=0')
                            .then(rest => {
                                totalstudents = rest[0][0].t
                                console.table(req.session);
                                res.status(200).render('admin-profile', { title: (rows.fname + ' ' + rows.lname), profile: true, data: rows, dashboard: true, admin: true, total: total, totalstudents: totalstudents, totalteachers: (total - totalstudents) })
                            })
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    } else {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/admin/login');
    }
});
app.get('/admin/logout', (req, res, next) => {
    req.session.isAdminLoggedIn = false;
    req.session.user = '';
    req.session.admin = false;
    req.session.save(err => {
        if (err) {
            console.log('Error saving: ' + err);
        } else
            res.redirect('/');
    })
});
app.get('/admin/login', (req, res, next) => {
    res.render('admin-login', { title: 'Admin Login', loginPage: true, form: true, err: req.flash('error')[0] });
});
app.post('/admin/login', (req, res, next) => {
    db.execute('select * from admin where uname=?', [req.body.email])
        .then(rows => {
            rows = rows[0][0];
            if (rows) {
                encrypt.compare(req.body.password, rows.password)
                    .then(ans => {
                        if (ans) {
                            req.session.admin = true;
                            req.session.isAdminLoggedIn = true;
                            req.session.user = req.body.email;
                            req.session.save(err => {
                                if (err) {
                                    console.log('Error saving ' + err)
                                } else
                                    res.redirect('/admin');
                            })
                        } else {
                            req.flash('error', 'Password not match');
                            res.redirect('/admin/login');
                        }
                    })
                    .catch(err => console.log(err));
            } else {
                req.flash('error', 'Record not found');
                res.redirect('/admin/login');
            }
        })
        .catch(err => console.log(err));
});
app.get('/admin/signup', (req, res, next) => {
    res.render('admin-signup', { title: 'Admin SignUp', signupPage: true, form: true });
});
app.post('/admin/signup', (req, res, next) => {
    db.execute('select * from admin')
        .then(rows => {
            rows = rows[0][0];
            if (!rows) {
                encrypt.hash(req.body.password, 12)
                    .then(pass => {
                        db.execute('insert into admin values(?,?,?,?,?,?)', [req.body.fname, req.body.lname, req.body.gender, req.body.contact, req.body.email, pass])
                            .then(rows => {
                                res.redirect('/admin');
                            })
                            .catch(err => { console.log(err) });
                    })
                    .catch(err => { console.log(err) });
            } else {
                console.log('Record already exists');
                res.redirect('/admin/login');
            }
        })
        .catch(err => { console.log(err) });
});
app.get('/admin/:type', (req, res, next) => {
    if (req.session.admin && req.session.isAdminLoggedIn) {
        let usertype = 1;
        let title = 'Teachers';
        if (req.params.type == 'students') {
            usertype = 0;
            title = 'Students';
        } else if (req.params.type == 'teachers') {
            usertype = 1;
            title = 'Techers';
        } else {
            next();
            return;
        }
        db.execute('select * from record where type=? order by fname', [usertype])
            .then(rows => {
                rows = rows[0];
                res.status(200).render('admin-records', { title: title, data: rows, student: usertype == 0, dashboard: true, admin: true, size: rows.length > 0, record: true });
            })
            .catch(err => console.log(err));
    } else {
        req.flash('error', 'Please LogIn to continue');
        res.redirect('/admin/login');
    }
});
app.use((req, res, next) => {
    res.status(404).render('404', { title: 'Page Not Found', dashboard: req.session.isLoggedIn, admin: req.session.admin, student: req.session.type == 0 });
});
app.listen(PORT, host, () => {
    let ser = 'http://' + host + ':' + PORT;
    console.log('Server running on '.red.bold + ser.yellow.bold);
});