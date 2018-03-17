const express = require('express');

// Import the configured database reference
const { mongoose } = require('./db/mongoose');

// Import the models
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();

/*
Use built-in middleware (previously required importing body-parser) to parse
the body of a POST request as JSON.
*/
app.use(express.json());

// Create a new to-do item
app.post('/todos', (req, res) => {
  // First create an instance of the Todo model
  const todo = new Todo({ text: req.body.text });

  // Now save the instance (document) to the database
  todo.save().then(
    doc => {
      res.send(doc);
    },
    err => {
      res.status(400).send(err);
    }
  );
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
