var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var utilities = require('../utilities/utilities.js');
var crypto = require('crypto');

module.exports = function(passport) {
	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	}, function(req, email, password, done){
		if(email){
			email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
		}

		var finding = {'email':  email};

		if(req.body.byAccountType){
			if(req.body.byAccountType == 'admin'){
				finding.account_type = 'admin';
			}else{
				finding.account_type = {$ne: 'admin'};
			}
		}

		// asynchronous
		process.nextTick(function(){
			User.findOne(finding, function(err, user){
				// if there are any errors, return the error
				if(err){
					return done(err);
				}

				// if no user is found, return the message
				if(!user){
					return done(null, false, {'error': 'No user found.'});
				}

				if(!user.validPassword(password)){
					return done(null, false, {'error': 'Oops! Wrong password.'});
				}else{// all is well, return user
					if(user.accountStatus == 'terminated'){
						return done(null, false, {'error': 'Your account has been terminated.'});
					}else{
						var token = user.generateJwt();
						user.token = token;
						
						return done(null, user, {token: token});
					}
				}
			});
		});
	}));

	// =========================================================================
	// LOCAL REGISTER ==========================================================
	// =========================================================================
	passport.use('local-register', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	}, function(req, email, password, done){
		// asynchronous
		process.nextTick(function(){
			let email = req.body.email;
			email = email.toLowerCase();

			User.findOne({'email': email}, function(err, user){
				// if there are any errors, return the error
				if(err){
					return done(err);
				}
					
				// check to see if theres already a user with that email
				if(user){
					return done(null, user, {registered: true});
				}else{
					let username = req.body.username;
					username = username ? username.replace(' ', '') : '';

					// create the user
					const user = new User();

					user.email = email;
					user.username = username;
					user.givenID = user.makeUniqueID(20);
					user.emailConfirmationToken = user.makeUniqueID(20);
					user.setPassword(req.body.password);

					user.save(function(err, user) {
						if(err){
							return done(err);
						}

						const template = 'newUserRegistration';
						const receiverName = (username) ? username : email;
						const templateOptions = {
							receiverName: receiverName
						};

						utilities.sendEmail(email, 'Welcome to Virtual Tour Builder!', template, templateOptions, function(){
							console.log('Email sent successfully!');
						});

						utilities.sendEmail(email, 'Please confirm your email!', 'emailConfirmation', {
							receiverName: receiverName,
							url: 'http://www.xyz.xyz/email-confirmation/' + user.emailConfirmationToken
						}, function(){
							console.log('Email sent successfully!');
						});

						var token = user.generateJwt();
						user.token = token;
						
						return done(null, user, {token: token});
					});
				}
			});
		});
	}));
};