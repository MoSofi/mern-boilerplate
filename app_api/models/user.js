var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
		required: true,
		index: true
	},
	username: String,
	givenID: {
		type: String,
		unique: true,
		required: true
	},
	role: String,

	firstname: String,
	lastname: String,
	email: String,
	phone: String,
	address1: String,
	address2: String,
	city: String,
	state: String,
	country: String,
	zip: String,
	about: String,
	account_type: String,

	emailConfirmationToken: String,
	emailConfirmed: {
		type: Boolean,
		"default": false
	},


	accountStatus: {
		type: String,
		"default": 'active'
	},
	registeredOn: {
		type: Date,
		"default": Date.now
	},
	hash: String,
	salt: String,

	resetPasswordToken: String,
	resetPasswordExpires: Date
});

userSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
};

userSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
	return this.hash === hash;
};

userSchema.methods.makeUniqueID = function(codeLength) {
	codeLength = codeLength || 4;

	var code = "";
	var possibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for(var i=0; i < codeLength; i++){
		code += possibles.charAt(Math.floor(Math.random() * possibles.length));
	}
	return code;
};

userSchema.methods.generateJwt = function() {
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 7);

	return jwt.sign({
		_id: this._id,
		email: this.email,
		username: this.username,
		exp: parseInt(expiry.getTime() / 1000),
	}, process.env.JWT_SECRET); // DO NOT KEEP YOUR SECRET IN THE CODE!
};

mongoose.model('User', userSchema);