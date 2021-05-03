'use strict';

const stringify = require('json-stringify-safe')
const express = require('serverless-express/express')
const app = express()

const UtilsService = require('./services/utils.service')
const PaymentController = require('./controllers/payment.controller')

// req.apiGateway.context = context, req.apiGateway.event = event

app.use(UtilsService.addLogId)
app.get(UtilsService.createRoute('/:referenceId'), PaymentController.getRequestData)
app.use(UtilsService.fileNotFoundHandler)
app.use(UtilsService.errorHandler)

module.exports = app
