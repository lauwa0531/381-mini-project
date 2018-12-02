var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();

var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var formidable = require('formidable');
var fs = require('fs');
var mongourl = 'mongodb://project:123456a@ds149682.mlab.com:49682/12014124';
var ac = {};
app = express();


var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

app.set('view engine', 'ejs');

app.use(session({
	name: 'session',
	keys: [SECRETKEY1, SECRETKEY2],
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(function (req, res, next) { // middleware
	console.log('middleware\n');
	/*
	if (!req.session.authenticated) {
		res.redirect('/');
	}
	*/
	if (!ac.length) {
		console.log('no ac\n');
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			findaccount(db, function (account) {
				db.close();
				console.log('Disconnected MongoDB\n');
				//console.log(account);
				ac = account;
				next();
			});
		});
	} else {
		next();
	}
})

app.get('/', function (req, res) {// no need ejs
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.redirect('/list');
	}
});

app.get('/list', function (req, res) {//ejs ed

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var parsedURL = url.parse(req.url, true); //true to get query as object
		var queryAsObject = parsedURL.query;
		console.log(req.session);
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			var criteria = {};
			if (queryAsObject) {
				for (key in queryAsObject) {
					criteria[key] = queryAsObject[key];
				}
			}
			findRestaurants(db, criteria, function (restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');

				res.render("list.ejs", { "jsonset": restaurants, "criteria": JSON.stringify(criteria) });
				res.end();
				/*
				res.writeHead(200, { "Content-Type": "text/html" });
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body><H1>Restaurants</H1>');
				res.write('<H2>Showing ' + restaurants.length + ' document(s) Criteria: ' + JSON.stringify(criteria) + '</H2>');
				res.write('<ol>');
				for (var i in restaurants) {
					res.write('<li><a href=/display?_id=' +
						restaurants[i].restaurant_id + '>' + restaurants[i].name +
						'</a></li>');
				}
				res.write('</ol>');
				res.write('<form action="/logout" method="get">');
				res.write('<input type="submit" value="logout">');
				res.write('</form>');

				res.write('<form action="/create" method="get">');
				res.write('<input type="submit" value="create collection">');
				res.write('</form>');


				res.write('<form action="/search" method="get">');
				res.write('<input type="submit" value="search">');
				res.write('</form>');

				res.write('<form action="/list" method="get">');
				res.write('<input type="submit" value="search all">');
				res.write('</form>');
				res.end('</body></html>');
				*/
			});
		});
	}
});

app.get('/search', function (req, res) {//ejs ed

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(null, err);
			findDistinctBorough(db, function (boroughs) {
				findDistinctname(db, function (names) {
					findDistinctcuisine(db, function (cuisines) {
						db.close();
						res.render("search.ejs", { "boroughs": boroughs, "names": names, "cuisines": cuisines });
						res.end();
						/*
						res.writeHead(200, { "Content-Type": "text/html" });
						res.write("<html><body>");
						res.write('<form action="/list" method="get">');
	
						res.write("Borough: ");
						res.write("<select name=\"borough\">");
						for (i in boroughs) {
							res.write("<option value=\"" +
								boroughs[i] + "\">" + boroughs[i] + "</option>");
						}
						res.write("</select>");
						res.write("<input type=\"submit\" value=\"Search\">");
						res.write("</form>");
	
						res.write('<form action="/list" method="get">');
						res.write("Name: ");
						res.write("<select name=\"name\">");
						for (i in names) {
							res.write("<option value=\"" +
								names[i] + "\">" + names[i] + "</option>");
						}
						res.write("</select>");
	
						res.write("<input type=\"submit\" value=\"Search\">");
						res.write("</form>");
	
						res.write('<form action="/list" method="get">');
						res.write("Cusine: ");
						res.write("<select name=\"cuisine\">");
						for (i in cuisines) {
							res.write("<option value=\"" +
								cuisines[i] + "\">" + cuisines[i] + "</option>");
						}
						res.write("</select>");
						res.write("<input type=\"submit\" value=\"Search\">");
						res.write("</form>");
						res.write("</body></html>");
						res.end();
						*/
					});
				});
			});

		});
	}
});

app.get('/create', function (req, res) {//ejs ed

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			findRestaurants(db, {}, function (restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');
				res.render("createcollection.ejs", { restaurant_id: (restaurants.length + 1) });
				res.end();
				/*
				res.writeHead(200, { "Content-Type": "text/html" });
				res.write('<html><title>create collection</title>');
				res.write('<body>');
				res.write("<form id='details' method='POST' action='/createcolltion' enctype='multipart/form-data'>");
				res.write('create collection<br><br>');
				res.write('<input type="hidden" name="id" value="' + (restaurants.length + 1) + '">');
				res.write('Name: <input type="text" name="name" value="" ><br>');
				res.write('Borough: <input type="text" name="borough" value="" ><br>');
				res.write('Cuisine: <input type="text" name="cuisine" value="" ><br>');
				res.write('<br>Address<br>')
				res.write('Building: <input type="text" name="building" value="" ><br>');
				res.write('Street: <input type="text" name="street" value="" ><br>');
				res.write('zipcode: <input type="text" name="zipcode" value="" ><br>');
				res.write('GPS Coordinates (lon.): <input type="text" name="lon" value="" ><br>');
				res.write('GPS Coordinates (lat.): <input type="text" name="lat" value="" ><br>');
				res.write('<br>Title: <input type="text" name="title" minlength=1><br>');
				res.write('<input type="file" name="filetoupload"><br>');
				res.write('</form>');
				res.write('<script>');
				res.write('function goBack() {window.history.back();}');
				res.write('</script>');
				res.write('<button type="submit" form="details" >Submit</button>');
				res.end('<button onclick="goBack()">Go Back</button>');
				*/
			});
		});
	}
});

app.post('/createcolltion', function (req, res) {// no need ejs

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var form = new formidable.IncomingForm();
		form.parse(req, function (err, fields, files) {
			console.log(JSON.stringify(files));
			var mimetype = files.filetoupload.type;
			var filename = files.filetoupload.path;
			fs.readFile(filename, function (err, data) {
				var new_r = {};	// document to be inserted
				new_r['restaurant_id'] = fields.id;
				if (fields.name) new_r['name'] = fields.name;
				if (fields.borough) new_r['borough'] = fields.borough;
				if (fields.cuisine) new_r['cuisine'] = fields.cuisine;
				//if (req.body.photo) new_r['photo'] = req.body.photo;
				//if (req.body.photomimetype) new_r['photomimetype'] = req.body.photomimetype;
				if (fields.building || fields.street) {
					var address = {};
					if (fields.street) address['street'] = fields.street;
					if (fields.building) address['building'] = fields.building;
					if (fields.zipcode) address['zipcode'] = fields.zipcode;
					var coord = []
					coord.push(parseFloat(fields.lat));
					coord.push(parseFloat(fields.lon));
					if (fields.lon && fields.lat) address['coord'] = coord;
					new_r['address'] = address;
				}
				var grades = [];
				new_r['grades'] = grades;
				new_r['owner'] = req.session.userid;
				if (data && mimetype != 'application/octet-stream') new_r['photomimetype'] = mimetype;
				if (data && Buffer(data).toString('base64')) new_r['photo'] = new Buffer(data).toString('base64');
				if (new_r['photo'] && fields.title) new_r['phototitle'] = fields.title;

				MongoClient.connect(mongourl, function (err, db) {
					assert.equal(err, null);
					console.log('Connected to MongoDB\n');
					insertRestaurant(db, new_r, function (result) {
						db.close();
						console.log('disconnected to MongoDB\n');
						console.log(result + '\n');
						res.redirect('/');
						/*
						res.writeHead(200, { "Content-Type": "text/plain" });
						res.write(JSON.stringify(new_r));
						res.end("\ninsert was successful!");
						*/
					});
				});
			});
		})
	}



});

app.get('/display', function (req, res) {//ejs ed

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var parsedURL = url.parse(req.url, true); //true to get query as object
		var queryAsObject = parsedURL.query;
		console.log(req.session);
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			db.collection('restaurant').findOne({ restaurant_id: queryAsObject._id }, function (err, doc) {
				assert.equal(err, null);
				db.close();
				console.log('Disconnected from MongoDB\n');
				/*
								res.writeHead(200, { "Content-Type": "text/html" });
								res.write('<html><title>' + doc.name + '</title>');
								res.write('<body>');
								res.write('<center><h1>' + doc.name + '</h1></center>');
								if (doc.photo) {
									res.write('<img src="data:' + doc.photomimetype + ';base64, ' + doc.photo + '"><br>');
								}
								*/
				borough = '';
				cuisine = '';
				if (doc.borough) borough = doc.borough;
				if (doc.borough) cuisine = doc.cuisine;
				/*
				res.write('Borough = ' + borough + '<br>');
				res.write('Cuisine = ' + cuisine + '<br>');
				res.write('<br>Address:<br>')
				*/
				building = '';
				street = '';
				zipcode = '';
				coord = [];
				if (doc.address) {
					if (doc.address.building) building = doc.address.building;
					if (doc.address.street) street = doc.address.street;
					if (doc.address.zipcode) zipcode = doc.address.zipcode;
					if (doc.address.coord) coord = doc.address.coord;
				}
				/*
				res.write('building = ' + building + '<br>');
				res.write('street = ' + street + '<br>');
				res.write('zipcode = ' + zipcode + '<br>');
				res.write('GPS = [' + coord + ']<br>');
				res.write('<br>Rating:<br>');
				for (i = 0; i < doc.grades.length; i++) {
					name = 'na';
					for (y = 0; y < ac.length; y++) {
						if (ac[y]._id == doc.grades[i].id) {
							name = ac[y].name;
						}
					}
					res.write('			' + doc.grades[i].score + ' (' + name + ')' + '<br>');
				}
				*/
				ownername = 'na';
				for (y = 0; y < ac.length; y++) {
					if (doc.owner == ac[y]._id) {
						ownername = ac[y].name;
					}
				}
				/*
								res.write('<br>created by: ' + ownername + '<br>');
				
								if (coord) {
									res.write('<a href=/googlemap?lat=' + doc.address.coord[1] + '&lon=' + doc.address.coord[0] + '&zoom=18>google map</a><br>');
								}
				
								res.write('<form action="/rate" method="get">');
								res.write('<input type="hidden" name="restaurant_id" value="' + queryAsObject._id + '">');
								res.write('<input type="submit" value="rate">');
								res.write('</form>');
				
								res.write('<form action="/update" method="get">');
								res.write('<input type="hidden" name="restaurant_id" value="' + queryAsObject._id + '">');
								res.write('<input type="hidden" name="owner" value="' + doc.owner + '">');
								res.write('<input type="submit" value="update">');
								res.write('</form>');
				
								res.write('<form action="/delete" method="get">');
								res.write('<input type="submit" value="delete">');
								res.write('<input type="hidden" name="restaurant_id" value="' + queryAsObject._id + '">');
								res.write('<input type="hidden" name="owner" value="' + doc.owner + '">');
								res.write('</form>');
				
								res.write('<script>');
								res.write('function goBack() {window.history.back();}');
								res.write('</script>');
								res.end('<button onclick="goBack()">Go Back</button>');
				*/

				var output = {
					"name": doc.name,
					"photomimetype": doc.photomimetype,
					"photo": doc.photo,
					"borough": borough,
					"cuisine": cuisine,
					"building": building,
					"street": street,
					"zipcode": zipcode,
					"coord": coord,
					"grades": doc.grades,
					"ac": ac,
					"ownername": ownername,
					"restaurant_id": queryAsObject._id,
					"owner": doc.owner
				};

				res.render("display.ejs", output);

				res.end();
			});
		});
	}
});

app.get('/rate', function (req, res) {//ejs ed

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var parsedURL = url.parse(req.url, true); //true to get query as object
		var queryAsObject = parsedURL.query;
		console.log(req.session);
		glist = []
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			var criteria = {};
			criteria['restaurant_id'] = queryAsObject.restaurant_id;
			db.collection('restaurant').findOne(criteria, function (err, doc) {
				assert.equal(err, null);
				db.close();
				console.log('Disconnected from MongoDB\n');
				var isnotrated = 1;
				console.log(req.session.userid);
				for (i = 0; i < doc.grades.length; i++) {
					if (req.session.userid == doc.grades[i].id) {
						isnotrated = 0;
						console.log(doc.grades[i].id);
					}
				}
				if (isnotrated) {
					res.render("rate.ejs", { restaurant_id: queryAsObject.restaurant_id });
					res.end();
					/*
					res.writeHead(200, { "Content-Type": "text/html" });
					res.write('<html><title>  rate  </title>');
					res.write('<body>');
					res.write('<form action="/rateupdate" method="get">');
					res.write('<input type="hidden" name="restaurant_id" value="' + queryAsObject.restaurant_id + '"><br>');
					res.write('Score: <input type="number" name="score" value="" min = "0" max = "10"><br>');
					res.write('<input type="submit" value="rate">');
					res.write('</form>');
					res.write('<script>');
					res.write('function goBack() {window.history.back();}');
					res.write('</script>');
					res.end('<button onclick="goBack()">Go Back</button>');
					*/
				} else {
					res.redirect('/error?reson=you have rated!');
				}
			});
		});
	}
});

app.get('/rateupdate', function (req, res) {// no need ejs
	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var parsedURL = url.parse(req.url, true); //true to get query as object
		var queryAsObject = parsedURL.query;
		console.log(req.session);
		var criteria = {};
		criteria['restaurant_id'] = queryAsObject.restaurant_id;
		//queryAsObject.score

		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			findRestaurants(db, criteria, function (restaurants) {
				var isnotrated = 1;
				console.log(req.session.userid);
				for (i = 0; i < restaurants[0].grades.length; i++) {
					if (req.session.userid == restaurants[0].grades[i].id) {
						isnotrated = 0;
						console.log(restaurants[0].grades[i].id);
					}
				}
				if (isnotrated) {
					var newValues = {};
					newValues['id'] = req.session.userid;
					newValues['score'] = queryAsObject.score;
					restaurants[0].grades.push(newValues);
					console.log('Preparing update: ' + JSON.stringify(restaurants[0]));
					updateRestaurant(db, criteria, restaurants[0], function (result) {
						db.close();
						console.log('disconnected to MongoDB\n');
						console.log(result + '\n');
						res.redirect('/');
						/*
						res.writeHead(200, { "Content-Type": "text/plain" });
						res.end("update was successful!");
						*/
					});
				} else {
					res.redirect('/error?reson=you have rated!');
				}
			});
		});
	}
});

app.get('/update', function (req, res) {

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var parsedURL = url.parse(req.url, true); //true to get query as object
		var queryAsObject = parsedURL.query;
		var criteria = {};
		criteria['restaurant_id'] = queryAsObject.restaurant_id;
		if (req.session.userid == queryAsObject.owner) {
			MongoClient.connect(mongourl, function (err, db) {
				assert.equal(err, null);
				console.log('Connected to MongoDB\n');
				findRestaurants(db, criteria, function (restaurants) {
					db.close();
					console.log('Disconnected MongoDB\n');
					/*
					res.writeHead(200, { "Content-Type": "text/html" });
					res.write('<html><title></title>');
					res.write('<body>');
					res.write("<form id='details' method='POST' action='/updatecolltion' enctype='multipart/form-data'>");
					res.write('<input type="hidden" name="restaurant_id" value="' + restaurants[0].restaurant_id + '">');
					res.write('update collection<br><br>');
					*/
					var name = '';
					if (restaurants[0].name) name = restaurants[0].name;
					//res.write('Name: <input type="text" name="name" value="' + name + '" ><br>');
					var borough = '';
					if (restaurants[0].borough) borough = restaurants[0].borough;
					//res.write('Borough: <input type="text" name="borough" value="' + borough + '" ><br>');
					var cuisine = '';
					if (restaurants[0].cuisine) cuisine = restaurants[0].cuisine;
					//res.write('Cuisine: <input type="text" name="cuisine" value="' + cuisine + '" ><br>');

					var building = '';
					var street = '';
					var zipcode = '';
					var lon = 0.0;
					var lat = 0.0;
					//res.write('<br>Address<br>')
					if (restaurants[0].address) {
						if (restaurants[0].address.building) building = restaurants[0].address.building;
						if (restaurants[0].address.street) street = restaurants[0].address.street;
						if (restaurants[0].address.zipcode) zipcode = restaurants[0].address.zipcode;
						if (restaurants[0].address.coord) {
							lon = restaurants[0].address.coord[0];
							lat = restaurants[0].address.coord[1];
						}
					}
					/*
										res.write('Building: <input type="text" name="building" value="' + building + '" ><br>');
										res.write('Street: <input type="text" name="street" value="' + street + '" ><br>');
										res.write('zipcode: <input type="text" name="zipcode" value="' + zipcode + '" ><br>');
										res.write('GPS Coordinates (lon.): <input type="text" name="lon" value="' + lon + '" ><br>');
										res.write('GPS Coordinates (lat.): <input type="text" name="lat" value="' + lat + '" ><br>');
					*/

					var phototitle = '';
					if (restaurants[0].phototitle) phototitle = restaurants[0].phototitle;
					/*
					res.write('<br>Title: <input type="text" name="title" minlength=1 value="' + phototitle + '"><br>');
					res.write('<input type="file" name="filetoupload"><br>');

					res.write('</form>');
					res.write('<script>');
					res.write('function goBack() {window.history.back();}');
					res.write('</script>');
					res.write('<button type="submit" form="details" >Submit</button>');
					res.end('<button onclick="goBack()">Go Back</button>');
					*/
					var output = {
						"name": name,
						"borough": borough,
						"cuisine": cuisine,
						"building": building,
						"street": street,
						"zipcode": zipcode,
						"lon": lon,
						"lat": lat,
						"restaurant_id": restaurants[0].restaurant_id,
						"title": phototitle
					};

					res.render("update.ejs", output);

					//res.end();
				});
			});
		} else {
			res.redirect('/error?reson=you are not the owner');
		}
	}
});

app.get('/error', function (req, res) {//ejs ed
	var parsedURL = url.parse(req.url, true); //true to get query as object
	var queryAsObject = parsedURL.query;
	res.render("error.ejs", { errormesg: queryAsObject.reson });
	res.end();
	/*
	res.writeHead(200, { "Content-Type": "text/html" });
	res.write('<html><title>  error  </title>');
	res.write('<center><h1>!!Error!!</h1></center>');
	res.write(queryAsObject.reson + '<br>');
	res.write('<script>');
	res.write('function goBack() {window.history.back();}');
	res.write('</script>');
	res.end('<button onclick="goBack()">Go Back</button>');
	*/
});

app.post('/updatecolltion', function (req, res) {//no need ejs

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var form = new formidable.IncomingForm();
		form.parse(req, function (err, fields, files) {
			console.log(JSON.stringify(files));
			var mimetype = files.filetoupload.type;
			var filename = files.filetoupload.path;
			fs.readFile(filename, function (err, data) {
				var new_r = {};	// document to be inserted
				if (fields.name) new_r['name'] = fields.name;
				if (fields.borough) new_r['borough'] = fields.borough;
				if (fields.cuisine) new_r['cuisine'] = fields.cuisine;
				if (fields.building || fields.street) {
					var address = {};
					if (fields.street) address['street'] = fields.street;
					if (fields.building) address['building'] = fields.building;
					if (fields.zipcode) address['zipcode'] = fields.zipcode;
					var coord = []
					coord.push(parseFloat(fields.lat));
					coord.push(parseFloat(fields.lon));
					if (fields.lon && fields.lat) address['coord'] = coord;
					new_r['address'] = address;
				}
				if (mimetype != 'application/octet-stream') {
					new_r['photomimetype'] = mimetype;
					if (Buffer(data).toString('base64')) new_r['photo'] = new Buffer(data).toString('base64');
					if (fields.title) new_r['phototitle'] = fields.title;
				}

				MongoClient.connect(mongourl, function (err, db) {
					assert.equal(err, null);
					console.log('Connected to MongoDB\n');
					criteria = {};
					criteria['restaurant_id'] = fields.restaurant_id;
					updateRestaurant(db, criteria, new_r, function (result) {
						db.close();
						console.log('disconnected to MongoDB\n');
						console.log(result + '\n');
						res.redirect('/');
						/*
						res.writeHead(200, { "Content-Type": "text/plain" });
						res.write(JSON.stringify(new_r));
						res.end("update was successful!");
						*/
					});
				});
			});
		})
	}



});

app.get('/login', function (req, res) {//ejs ed
	if (req.session.authenticated) {
		res.redirect('/');
	} else {
		//res.sendFile(__dirname + '/public/login.html');
		res.render("login.ejs");
		res.end();
	}
});

app.post('/login', function (req, res) {//no need ejs
	if (!req.session.authenticated) {
		for (var i = 0; i < ac.length; i++) {
			if (ac[i].name == req.body.name &&
				ac[i].password == req.body.password) {
				req.session.authenticated = true;
				req.session.userid = ac[i]._id;
				console.log('is logined\n');
			}
		}
	}
	res.redirect('/');
});

app.get('/createac', function (req, res) {//ejs ed
	//res.sendFile(__dirname + '/views/create.html');
	res.render("createac.ejs");
	res.end();
});

app.post('/createac', function (req, res) {//no need ejs 
	console.log(req.body.name);
	var newac = {};
	newac.name = req.body.name;
	newac.password = req.body.password;
	console.log('About to insert: ' + JSON.stringify(newac));
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		console.log('Connected to MongoDB\n');
		var isused = 0;
		for (y = 0; y < ac.length; y++) {
			if (newac.name == ac[y].name) {
				isused = 1;
			}
		}
		if(!isused){
			insertAccount(db, newac, function (result) {
				console.log(JSON.stringify(result));
				findaccount(db, function (account) {
						db.close();
						console.log('Disconnected MongoDB\n');
						//console.log(account);
						ac = account;
						res.redirect('/');
						/*
				res.writeHead(200, { "Content-Type": "text/html" });
				res.write('<html><title>ok</title>');
				res.write('created');
				res.write('<script>');
				res.write('function goBack() {window.history.back();}');
				res.write('</script>');
				res.end('<button onclick="goBack()">Go Back</button>');
				*/
				});
			});
		}else{
			res.redirect('/error?reson=your user name is used');
		}
	});
});

app.get('/delete', function (req, res) {//no need ejs

	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		var parsedURL = url.parse(req.url, true); //true to get query as object
		var queryAsObject = parsedURL.query;
		console.log(req.session);
		if (req.session.userid == queryAsObject.owner) {

			MongoClient.connect(mongourl, function (err, db) {
				assert.equal(err, null);
				console.log('Connected to MongoDB\n');
				var criteria = {};
				criteria['restaurant_id'] = queryAsObject.restaurant_id;
				deleteRestaurant(db, criteria, function (result) {
					db.close();
					console.log('disconnected to MongoDB\n');
					console.log(result + '\n');
					res.redirect('/');
					/*
							res.writeHead(200, { "Content-Type": "text/plain" });
							res.write(result + '<br>');
							res.end("delete was successful!");
							*/
				});
			});

		} else {
			res.redirect('/error?reson=you are not the owner');
		}
	}


});

app.get('/logout', function (req, res) {//no need ejs
	req.session = null;
	res.redirect('/');
});

app.get("/googlemap", function (req, res) {//ejs ed
	if (!req.session.authenticated) {
		res.redirect('/');
	} else {
		res.render("gmap.ejs", {
			lat: req.query.lat,
			lon: req.query.lon,
			zoom: req.query.zoom
		});
		res.end();
	}
});

function findaccount(db, callback) {
	var account = [];
	cursor = db.collection('account').find();
	cursor.each(function (err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			account.push(doc);
		} else {
			callback(account);
		}
	});
}

function updateRestaurant(db, criteria, newValues, callback) {
	db.collection('restaurant').updateOne(
		criteria, { $set: newValues }, function (err, result) {
			assert.equal(err, null);
			console.log("update was successfully");
			callback(result);
		});
}

function insertAccount(db, r, callback) {
	db.collection('account').insertOne(r, function (err, result) {
		assert.equal(err, null);
		console.log("Insert was successful!");
		callback(result);
	});
}

function findRestaurants(db, criteria, callback) {
	var restaurants = [];

	cursor = db.collection('restaurant').find(criteria);

	cursor.each(function (err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants);
		}
	});
}

function insertRestaurant(db, r, callback) {
	db.collection('restaurant').insertOne(r, function (err, result) {
		assert.equal(err, null);
		console.log("Insert was successful!");
		callback(result);
	});
}

function deleteRestaurant(db, criteria, callback) {
	db.collection('restaurant').deleteOne(criteria, function (err, result) {
		assert.equal(err, null);
		console.log("Delete was successfully");
		callback(result);
	});
}

function findDistinctBorough(db, callback) {
	db.collection('restaurant').distinct("borough", function (err, result) {
		console.log(result);
		callback(result);
	});
}

function findDistinctname(db, callback) {
	db.collection('restaurant').distinct("name", function (err, result) {
		console.log(result);
		callback(result);
	});
}

function findDistinctcuisine(db, callback) {
	db.collection('restaurant').distinct("cuisine", function (err, result) {
		console.log(result);
		callback(result);
	});
}

app.listen(process.env.PORT || 8099);

app.post("/api/restaurant/", function (req, res) {
	console.log('Request body: ', req.body);
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		console.log('Connected to MongoDB\n');
		findRestaurants(db, {}, function (restaurants) {
			req.body.restaurant_id = (restaurants.length + 1).toString();
			req.body.grades = [];
			insertRestaurant(db, req.body, function (result) {
				db.close();
				console.log('Disconnected to MongoDB\n');
				res.status(200).json(result).end();
			});
		});
	});
});

app.get('/api/restaurant/:kind/:value', function (req, res) {
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		console.log('Connected to MongoDB\n');
		var criteria = {};

		criteria[req.params.kind] = req.params.value;
		console.log(JSON.stringify(criteria));
		findRestaurants(db, criteria, function (restaurants) {
			db.close();
			console.log('Disconnected MongoDB\n');
			res.status(200).json(restaurants).end();

		});
	});
});