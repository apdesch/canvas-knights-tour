const express = require('express');
const path = require('path');
const morgan = require('morgan');

const app = express();

app
  .use(morgan('dev'))
  .use('/', express.static(path.join(__dirname, '/')))
  .listen(3030, console.log('Server started on localhost:3030'));
