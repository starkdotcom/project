var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/userHelpers');
var userDetails;
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')



router.get('/forgot', function (req, res) {
  res.render('account/forgot', { user: req.user });
});
router.post('/forgot', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
        console.log("inside crypto")
      });

    },
    function (token, done) {
      console.log(req.body.email)
      db.get().collection(collection.USER_COLLECTION).findOne({ email: req.body.email }, function (err, user) {
        if (!user) {

          req.flash('error', 'No account with that email address exists.');

          return res.redirect('/account/forgot');
        }
        var myquery = { email: user.email };
        var newvalues = { $set: { resetPasswordToken: token, resetPasswordExpires: Date.now() + 3600000 } };
        db.get().collection(collection.USER_COLLECTION).updateOne(myquery, newvalues, function (err, res) {
          if (err) throw err;

        });

        done(err, token, user);
      });
    },
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'username',
          pass: 'pasword'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/account/forgot');
  });
});
router.get('/reset/:token', function (req, res) {
  db.get().collection(collection.USER_COLLECTION).findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/account/forgot');
    }
    res.render('reset', { user: req.user });
  });
});
router.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      db.get().collection(collection.USER_COLLECTION).findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        var myquery = { resetPasswordToken: req.params.token };
        var newvalues = { $set: { Password: req.body.Password, resetPasswordToken: undefined, resetPasswordExpires: undefined, modifiedDate: Date(Date.now()) } };
        db.get().collection(collection.USER_COLLECTION).updateOne(myquery, newvalues, function (err, user) {
          if (err) throw err;
          console.log("document updated");
        });
        done(err, user);
      });

    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
          user: 'cipherdecryptor@gmail.com',
          pass: 'cipher10decryptor'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/');
  });
});

router.get('/login', function (req, res) {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  }
  else {
    res.render('account/login', { "loginErr": req.session.loginErr });
    req.session.loginErr = null;
  }
});
router.post('/login', (req, res) => {
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {
    if (response.stat) {
      req.session.userLoggedIn = true
      req.session.user = response.user
      if (req.session.redirectUrl) {
        redirectUrl = req.session.redirectUrl;
        req.session.redirectUrl = null;
        res.redirect(redirectUrl)
      }
      else {
        res.redirect('/')
      }
    }
    else {
      req.session.loginErr = "Invalid Username or Password"
      res.redirect('/account/login')
    }
  })
})
router.get('/signup', function (req, res) {
  res.render('account/signup', { 'signupErr': req.session.signupErr });
  req.session.signupErr = null
});
router.post('/signup', function (req, res) {
  userHelpers.doSignup(req.body).then((response, reject) => {
    if (response) {
      req.session.userLoggedIn = true
      req.session.user = response
      res.redirect('/')
    }
    else {
      req.session.signupErr = "Email Id already Exists";
      res.redirect('/signup')
    }

  })
})
router.get('/signout', function (req, res) {
  req.session.user = null
  req.session.userLoggedIn = null
  res.redirect('/');
})
module.exports = router;


