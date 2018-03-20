const express = require('express');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

// Import the configured database reference
const { mongoose } = require('./db/mongoose');

// Import the models
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

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

// Get all to-do items
app.get('/todos', (req, res) => {
  Todo.find().then(
    todos => {
      res.send({ todos });
    },
    err => {
      res.status(400).send(err);
    }
  );
});

// Get the desired to-do item (if it exists)
app.get('/todos/:id', (req, res) => {
  // Store the ID in a constant
  const id = req.params.id;

  // Check if the ID passed in is valid
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findById(id)
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }

      res.send({ todo });
    })
    .catch(err => {
      res.status(400).send();
    });
});

// Delete a to-do item
app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findByIdAndRemove(id)
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }

      res.send({ todo });
    })
    .catch(err => res.status(400).send());
});

// Update a to-do item
app.patch('/todos/:id', (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(todo => {
      if (!todo) {
        return res.status(404).send();
      }

      res.send({ todo });
    })
    .catch(err => res.status(400).send());
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = { app };
