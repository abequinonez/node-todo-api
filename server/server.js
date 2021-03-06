require('./config/config');

const express = require('express');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

// Import the configured database reference
const { mongoose } = require('./db/mongoose');

// Import the models and middleware
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

/*
Use built-in middleware (previously required importing body-parser) to parse
the body of a POST request as JSON.
*/
app.use(express.json());

// Create a new to-do item
app.post('/todos', authenticate, async (req, res) => {
  // First create an instance of the Todo model
  const todo = new Todo({ text: req.body.text, _creator: req.user._id });

  // Now save the instance (document) to the database
  try {
    const doc = await todo.save();
    res.send(doc);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get all to-do items
app.get('/todos', authenticate, async (req, res) => {
  try {
    const todos = await Todo.find({ _creator: req.user._id });
    res.send({ todos });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get the desired to-do item (if it exists)
app.get('/todos/:id', authenticate, async (req, res) => {
  // Store the ID in a constant
  const id = req.params.id;

  // Check if the ID passed in is valid
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const todo = await Todo.findOne({
      _id: id,
      _creator: req.user._id
    });

    if (!todo) {
      return res.status(404).send();
    }

    res.send({ todo });
  } catch (err) {
    res.status(400).send();
  }
});

// Delete a to-do item
app.delete('/todos/:id', authenticate, async (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const todo = await Todo.findOneAndRemove({
      _id: id,
      _creator: req.user._id
    });

    if (!todo) {
      return res.status(404).send();
    }

    res.send({ todo });
  } catch (err) {
    res.status(400).send();
  }
});

// Update a to-do item
app.patch('/todos/:id', authenticate, async (req, res) => {
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

  try {
    const todo = await Todo.findOneAndUpdate(
      {
        _id: id,
        _creator: req.user._id
      },
      { $set: body },
      { new: true }
    );

    if (!todo) {
      return res.status(404).send();
    }

    res.send({ todo });
  } catch (err) {
    res.status(400).send();
  }
});

// Create a new user
app.post('/users', async (req, res) => {
  // First pick off the properties we're interested in
  const body = _.pick(req.body, ['email', 'password']);

  // Next create an instance of the User model
  const user = new User(body);

  // Now try saving the instance (document) to the database
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get a user
app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

// Log in a user
app.post('/users/login', async (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);

  try {
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch (err) {
    res.status(400).send();
  }
});

// Log out a user
app.delete('/users/me/token', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch (err) {
    res.status(400).send();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = { app };
