const express = require('express');
const payRoute = require('./pay.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/pay',
    route: payRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
