const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('Attempting to connect to MongoDB Atlas at URI:', uri ? uri.replace(/:[^:]+@/, ':****@') : 'not defined');

mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS! Successfully connected to your MongoDB Atlas cluster.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('CONNECTION ERROR:', err.message);
    process.exit(1);
  });
