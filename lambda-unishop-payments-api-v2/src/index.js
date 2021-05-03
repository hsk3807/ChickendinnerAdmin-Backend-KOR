var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes');
var cors = require('cors');
var app = express();

// const helmet = require('helmet');
var useragent = require('express-useragent');

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(useragent.express());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// parse json request body
app.use(express.json());
// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

app.use(express.static('./src/static'));

// enable cors
app.use(cors());
// app.use(helmet.frameguard());
app.options('*', cors());

app.use((req, res, next) => {
  // res.setHeader('X-Frame-Options', 'ALLOW-FROM http://localhost');

  res.r = (result, error = undefined) => {
    console.log(error);
    res.json({
      isSuccess: error ? false : true,
      status: 200,
      //description: '성공',
      code: error ? error.code : 'COMMON_0000_CODE',
      message: error ? error.message : 'success',
      result,
    });
  };
  next();
});

// v1 api routes
app.use(routes);
module.exports = app;

//https://blog.cookapps.io/frameworks/serverless/tutorial-serverless-express-aurora/#step-2-serverless-yml-%EC%83%9D%EC%84%B1-%EB%B0%8F-%EC%84%A4%EC%A0%95
//https://medium.com/@sharathkumar.hegde/how-to-deploy-node-js-application-to-aws-lambda-97de881ecb25
//https://stackoverflow.com/questions/62688449/express-with-ejs-serverless-host-with-aws-lambda
