const express = require('express');
const payRoute = require('./pay.route');
const talkRoute = require('./talk.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/pay',
    route: payRoute,
  },
  {
    path: '/talk',
    route: talkRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
