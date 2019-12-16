var mongoose = require('mongoose');
var User = mongoose.model('User');
var utilities = require('../utilities/utilities.js');
var async = require('async');
var crypto = require('crypto');

module.exports.getUser = function(req, res){
	utilities.authorify(req, res, function(req, res, userId, userEmail){
		//var data = (Object.keys(req.query).length) ? req.query : req.body;

		User
			.findById(userId)
			.select('-hash -salt -__v')
			.exec(function(err, user){
				console.log('>>>>>>>>>>>>>>', userId);
				if(err){
					utilities.sendResJSON(res, 400, err);
				}else{
					utilities.sendResJSON(res, 200, user);
				}
			});
	});
};

module.exports.getUserNames = function(req, res){
	var data = (Object.keys(req.query).length) ? req.query : req.body;
	
	User
	.find({_id: {$in: data.users}})
	.select('firstname lastname')
	.exec(function (err, users){
		if(err){
			utilities.sendResJSON(res, 400, err);
		}else{
			utilities.sendResJSON(res, 200, users);
		}
	});
}

module.exports.userBasicInfo = function(req, res){
	var data = (Object.keys(req.query).length) ? req.query : req.body;

	User
		.findById(data.userId)
		.select('firstname lastname files')
		.exec(function(err, user){
			if(err){
				utilities.sendResJSON(res, 400, err);
			}

			if(user){
				var userFiles = user.files;
				var avatarObj = {};

				if(userFiles){
					userFiles.forEach(function(file){
						if(file.what == 'avatar'){
							avatarObj = {
								name: file.name,
								source: file.source
							};
						}
					});
				}

				utilities.sendResJSON(res, 200, {
					firstname: user.firstname,
					lastname: user.lastname,
					avatar: avatarObj,
				});
			}
		});
};

module.exports.updateProfile = function(req, res){
	utilities.authorify(req, res, function(req, res, userId, userEmail, userRole){
		var query = (Object.keys(req.query).length) ? req.query : req.body;
		var id = null;

		async.waterfall([
			function(done){
				if(query.other){
					utilities.userCan(userRole, 'get-driver', function(){
						id = query._id;
						done(null, id);
					});
				}else{
					id = userId;
					done(null, id);
				}
			},
			function(id, done){
				if(id){
					User
					.findById(id)
					.select('-hash -salt -__v')
					.exec(function(err, user){
						if(err){
							utilities.sendResJSON(res, 400, err);
						}else{
							var fields = ['username', 'firstname', 'lastname', 'email', 'phone', 'fax', 'address1', 'address2', 'city', 'state', 'country', 'zip', 'about', 'company_name', 'driver_license', 'license_number', 'driver_license_expiration', 'account_type', 'bg_check', 'approvedToWork'];
							fields.forEach(function(field){
								user[field] = query[field];
							});

							if(user.account_type == 'vendor'){
								user.insurance_coverage = query.insurance_coverage;
								user.liability_amount = query.liability_amount || 0;
								user.vendor_type = query.vendor_type;

								if(user.vendor_type == 'individual'){
									var company_fields = ['ssn'];
									
									company_fields.forEach(function(field){
										user[field] = query[field];
									});
								}else if(user.vendor_type == 'company'){
									var company_fields = ['company_position', 'company_tax_id', 'company_type', 'company_employees', 'company_email', 'company_website'];
									
									company_fields.forEach(function(field){
										user[field] = query[field];
									});
								}
							}

							user.accountStatus = query.accountStatus;

							//> TEMPORARY
							if(!user.givenID){
								user.givenID = utilities.makeUniqueID(10);
							}

							if(query.password){
								user.setPassword(query.password);
							}

							if(query.trucks){
								if(query.trucks.length){
									var myTrucks = query.trucks;
									var newTrucksArr = [];

									myTrucks.forEach(function(truck, index){
										//
										newTrucksArr.push({
											type: truck.type,
											make: truck.make,
											model: truck.model,
											year: truck.year,
											plate_number: truck.plate_number,

											max_payload: truck.max_payload,
											max_payload_unit: truck.max_payload_unit,
											max_capacity: truck.max_capacity,
											max_capacity_unit: truck.max_capacity_unit,

											registration_file: truck.registration_file,
											insurance_file: truck.insurance_file,

											registration_exp: truck.registration_exp,
											policy_number: truck.policy_number,
											insurance_exp: truck.insurance_exp
										});
									});

									user.trucks = newTrucksArr;
								}
							}

							user.save(function(err, user) {
								if(err){
									utilities.sendResJSON(res, 400, err);
								}else{
									utilities.sendResJSON(res, 200, user);
								}
							});
						}
					});
				}

			}
		], function(err){
			utilities.sendResJSON(res, 400, {error: err});
		});
	});
};

module.exports.changePassword = function(req, res) {
	utilities.authorify(req, res, function(req, res, userId, userRole){
		var query = (Object.keys(req.query).length) ? req.query : req.body;

		User
		.findById(userId)
		.select('-files')
		.exec(function(err, user){
			if(err){
				utilities.sendResJSON(res, 400, 'Error happened');
			}

			if(user){
				if(!user.validPassword(query.current_pw)){
					utilities.sendResJSON(res, 400, 'The provided password does not match the current password!');
				}else{
					user.setPassword(query.new_pw);

					user.save(function(err, user){
						if(err){
							utilities.sendResJSON(res, 400, 'Could not save the new password');
						}else{
							utilities.sendResJSON(res, 200, 'done');
						}
					});
				}
			}
		});
	});
}

module.exports.forgotPassword = function(req, res) {
	var query = (Object.keys(req.query).length) ? req.query : req.body;

	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
			var email = query.email;
			email = email.toLowerCase();

			User.findOne({ email: email}, function(err, user) {
				console.log('Hola!!!');
				if (!user) {
					utilities.sendResJSON(res, 200, {error: 'User not found'});
					return true;
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save(function(err, user) {
					done(null, token, user);
				});
			});
		},
		function(token, user, done){
			utilities.sendEmail(user.email, 'Zuba Password Reset', 'forgotPassword', {
				host: req.headers.host,
				token: token
			}, function(response){
				utilities.sendResJSON(res, 200, {response: response});
			});
		}
	], function(err){
		if(err){
			utilities.sendResJSON(res, 200, {error: err});
		}else{
			res.redirect('/forgot');
		}
	});
};

module.exports.emailConfirmation = function(req, res) {
	User
		.findOne({emailConfirmationToken: req.params.token})
		.select('emailConfirmed')
		.exec(function(err, user){
			if(!user){
				console.log('Error', err);
				utilities.sendResJSON(res, 400, {error: 'can not find the provided token'});
			}else{
				user.emailConfirmed = true;

				user.save(function(err, user){
					if(err){
						console.log('Error', err);
						utilities.sendResJSON(res, 400, err);
					}else{
						utilities.sendResJSON(res, 200, 'activated');
					}
				});
			}
		});
};

module.exports.checkResetPassword = function(req, res) {
	User
		.findOne({
			resetPasswordToken: req.params.token,
			resetPasswordExpires: { $gt: Date.now() }
		})
		.exec(function(err, user){
			if(!user){
				utilities.sendResJSON(res, 200, {error: 'Password reset token is invalid or has expired.'});
			}else{
				utilities.sendResJSON(res, 200, 'password reset');
			}
		});
};

module.exports.doResetPassword = function(req, res) {
	var query = (Object.keys(req.query).length) ? req.query : req.body;

	async.waterfall([
		function(done) {
			User
				.findOne({
					resetPasswordToken: req.params.token,
					resetPasswordExpires: { $gt: Date.now() }
				})
				.exec(function(err, user) {
					if(!user){
						utilities.sendResJSON(res, 200, {error: 'User not found'});
						return true;
					}

					user.setPassword(query.password);
					user.resetPasswordToken = undefined;
					user.resetPasswordExpires = undefined;

					user.save(function(err) {
						done(err, user);

					});
				});
		},
		function(user, done) {
			utilities.sendEmail(user.email, 'Your password has been changed', 'passwordResetConfirmation', {
				email: user.email,
				receiverName: user.username
			}, function(response){
				utilities.sendResJSON(res, 200, {response: response});
			});
		}
	], function(err) {
		res.redirect('/');
	});
};