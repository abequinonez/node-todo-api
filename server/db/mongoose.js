const mongoose = require('mongoose');

const dbUrl = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;
mongoose.connect(dbUrl);

module.exports = { mongoose };
