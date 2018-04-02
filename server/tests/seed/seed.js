const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('./../../models/todo');
const { User } = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const usersArr = [
  {
    _id: userOneId,
    email: 'user@email.com',
    password: 'userOnePass',
    tokens: [
      {
        access: 'auth',
        token: jwt
          .sign({ _id: userOneId.toHexString(), access: 'auth' }, 'abc123')
          .toString()
      }
    ]
  },
  {
    _id: userTwoId,
    email: 'anotheruser@email.com',
    password: 'userTwoPass',
    tokens: [
      {
        access: 'auth',
        token: jwt
          .sign({ _id: userTwoId.toHexString(), access: 'auth' }, 'abc123')
          .toString()
      }
    ]
  }
];

const todosArr = [
  { _id: new ObjectID(), text: 'First test todo', _creator: userOneId },
  {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completedAt: 123,
    _creator: userTwoId
  }
];

const populateTodos = done => {
  Todo.remove({})
    .then(() => {
      return Todo.insertMany(todosArr);
    })
    .then(() => done());
};

const populateUsers = done => {
  User.remove({})
    .then(() => {
      const userOne = new User(usersArr[0]).save();
      const userTwo = new User(usersArr[1]).save();

      return Promise.all([userOne, userTwo]);
    })
    .then(() => done());
};

module.exports = { todosArr, populateTodos, usersArr, populateUsers };
