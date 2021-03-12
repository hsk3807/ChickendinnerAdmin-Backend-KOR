var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes');
var app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// parse json request body
app.use(express.json());
// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// v1 api routes
app.use(routes);
module.exports = app;

//https://blog.cookapps.io/frameworks/serverless/tutorial-serverless-express-aurora/#step-2-serverless-yml-%EC%83%9D%EC%84%B1-%EB%B0%8F-%EC%84%A4%EC%A0%95
//https://medium.com/@sharathkumar.hegde/how-to-deploy-node-js-application-to-aws-lambda-97de881ecb25
//https://stackoverflow.com/questions/62688449/express-with-ejs-serverless-host-with-aws-lambda
