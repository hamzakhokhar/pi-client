'use strict';
const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
    name: 'pi-client',
    stream: process.stdout,
    level: 'debug'
});