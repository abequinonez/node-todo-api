const { ObjectID } = require('mongodb');

const { Todo } = require('./../../models/todo');
const { User } = require('./../../models/user');

const todosArr = [
  { _id: new ObjectID(), text: 'First test todo' },
  {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completedAt: 123
  },
  { _id: new ObjectID(), text: 'Third test todo' }
];

const populateTodos = done => {
  Todo.remove({})
    .then(() => {
      return Todo.insertMany(todosArr);
    })
    .then(() => done());
};

module.exports = { todosArr, populateTodos };
