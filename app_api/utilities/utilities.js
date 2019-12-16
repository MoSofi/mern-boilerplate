var mongoose = require('mongoose');
var User = mongoose.model('User');

var async = require('async');
var http = require('http'),
	fs = require('fs'),
	path = require('path');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport')
var transporter = nodemailer.createTransport(smtpTransport({
	service: 'Godaddy',
	host: "smtpout.secureserver.net",
	secureConnection: true,
	auth: {
		user: 'admin@xyz.xyz',
		pass: 'xyz'
	},
	port: 465,
	// tls: { rejectUnauthorized: false }
}));

const senderEmail = 'admin@xyz.xyz';

var sendResJSON = function(res, status, content) {
	res.status(status);
	res.json(content);
};

var authorify = function(req, res, callback){
	console.log("Finding author with email " + req.payload.email);
	if(req.payload.email){
		User
			.findOne({ email : req.payload.email })
			.exec(function(err, user){
				if(!user){
					sendResJSON(res, 404, {
						"message": "User not found"
					});
					return;
				}else if(err){
					//console.log(chalk.red(err));
					console.log(err);
					sendResJSON(res, 404, err);
					return;
				}
				
				callback(req, res, user._id, user.email, user.role, user.givenID);
			});

	}else{
		sendResJSON(res, 404, {
			"message": "User not found"
		});
		return;
	}
};

var makeUniqueID = function(codeLength) {
	codeLength = codeLength || 4;

	var code = "";
	var possibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for(var i=0; i < codeLength; i++){
		code += possibles.charAt(Math.floor(Math.random() * possibles.length));
	}
	return code;
};

var sendEmail = function(receiverEmail, subject, templateName, templateOptions, callback){
	var emailTemplates = {
		newDriverRegistration: '<b>Hello,</b><br><br>We are happy that you registered with Zuba.<br><br>Are you ready to deliver with us? <br> Thank you<br> Zuba',
		newVendorRegistration: '<b>Hello,</b><br><br>We are happy that you registeredwith Zuba. <br><br>Are you ready to deliver with us and make money? <br> Thank you<br>Zuba',
	}

	var emailHtml = emailTemplates[templateName];

	for(var key in templateOptions){
		if(templateOptions.hasOwnProperty(key)){
			if(emailHtml.search('{{'+ key +'}}') >= 0){
				emailHtml = emailHtml.replace(new RegExp('{{'+ key +'}}', 'g'), templateOptions[key]);
			};
		}
	}

	var mailOptions = {
		from: senderEmail,
		to: receiverEmail,
		subject: subject,
		html: emailHtml
	};

	transporter.sendMail(mailOptions, function(err, info){
		if(err){
			console.log(err);
		}else{
			console.log('Email sent: ' + info.response);
			callback(info.response);
		}
	});
}

module.exports.contactUs = function(req, res){
	var query = (Object.keys(req.query).length) ? req.query : req.body;
	var emailHtml = "<strong>Sender name</strong>: "+ query.senderName +"<br><strong>Sender email</strong>: "+ query.senderEmail +"<br>______________________________________________________________________________________<br><br>" + query.senderMessage;

	var mailOptions = {
		from: 'admin@xyz.xyz',
		to: 'info@xyz.xyz',
		subject: 'Message from ' + query.senderName + ' ['+ query.senderEmail +']',
		html: emailHtml
	};

	transporter.sendMail(mailOptions, function(err, info){
		if(err){
			sendResJSON(res, 200, err)
		}else{
			console.log('Email sent: ' + info.response);
			sendResJSON(res, 200, info.response)
		}
	});	
}

var sortByKey = function(array, key){
	return array.sort(function(a, b) {
		var x = a[key]; var y = b[key];
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});
}

var getRandomString = function(text){
	return text + Math.floor((Math.random() * 100000) + 1);
}

var getRandomInt = function(){
	return Math.floor((Math.random() * 100000) + 1);
}

var getRandomAmount = function(){
	return ((Math.random() * 100) + 1).toFixed(2);
}

var getDate = function(){
	return (new Date()).toISOString().substring(0, 10) ;
}

module.exports.sortByKey       = sortByKey;
module.exports.getRandomString = getRandomString;
module.exports.getRandomInt    = getRandomInt;
module.exports.getRandomAmount = getRandomAmount;
module.exports.getDate         = getDate;

module.exports.authorify    = authorify;
module.exports.sendResJSON  = sendResJSON;
module.exports.makeUniqueID = makeUniqueID;
module.exports.sendEmail    = sendEmail;