const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const {
  todosArr,
  populateTodos,
  usersArr,
  populateUsers
} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', done => {
    const text = 'Test todo text';

    request(app)
      .post('/todos')
      .set('x-auth', usersArr[0].tokens[0].token)
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create a todo with invalid body data', done => {
    request(app)
      .post('/todos')
      .set('x-auth', usersArr[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });
});

describe('GET /todos', () => {
  it('should get all to-do items', done => {
    request(app)
      .get('/todos')
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should get a to-do item', done => {
    request(app)
      .get(`/todos/${todosArr[0]._id.toHexString()}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todosArr[0].text);
      })
      .end(done);
  });

  it('should not return a to-do item created by another user', done => {
    request(app)
      .get(`/todos/${todosArr[1]._id.toHexString()}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo not found', done => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if object ID is invalid', done => {
    request(app)
      .get('/todos/123')
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should delete a to-do item', done => {
    const hexId = todosArr[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toNotExist();
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not delete another user\'s to-do item', done => {
    const hexId = todosArr[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toExist();
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return 404 if todo not found', done => {
    request(app)
      .delete(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if object ID is invalid', done => {
    request(app)
      .delete('/todos/123')
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the to-do item', done => {
    const hexId = todosArr[0]._id.toHexString();
    const text = 'Updated text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', usersArr[0].tokens[0].token)
      .send({ text, completed: true })
      .expect(200)
      .expect(res => {
        const todo = res.body.todo;
        expect(todo.text).toBe(text);
        expect(todo.completed).toBe(true);
        expect(todo.completedAt).toBeA('number');
      })
      .end(done);
  });

  it('should not update another user\'s to-do item', done => {
    const hexId = todosArr[0]._id.toHexString();
    const text = 'Updated text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', usersArr[1].tokens[0].token)
      .send({ text, completed: true })
      .expect(404)
      .end(done);
  });

  it('should clear completedAt when todo is not completed', done => {
    const hexId = todosArr[1]._id.toHexString();
    const text = 'Updated text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', usersArr[1].tokens[0].token)
      .send({ text, completed: false })
      .expect(200)
      .expect(res => {
        const todo = res.body.todo;
        expect(todo.text).toBe(text);
        expect(todo.completed).toBe(false);
        expect(todo.completedAt).toNotExist();
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', done => {
    request(app)
      .get('/users/me')
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toBe(usersArr[0]._id.toHexString());
        expect(res.body.email).toBe(usersArr[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', done => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', done => {
    const email = 'uniqueuser@example.com';
    const password = 'abc123!';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end(err => {
        if (err) {
          return done(err);
        }

        User.findOne({ email })
          .then(user => {
            expect(user).toExist();
            expect(user.password).toNotBe(password);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return validation errors if request invalid', done => {
    const email = 'bademail';
    const password = '123';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', done => {
    const email = usersArr[0].email;
    const password = 'abc123!';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should log in user and return auth token', done => {
    request(app)
      .post('/users/login')
      .send({ email: usersArr[1].email, password: usersArr[1].password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(usersArr[1]._id)
          .then(user => {
            expect(user.tokens[1]).toInclude({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should reject invalid login', done => {
    request(app)
      .post('/users/login')
      .send({
        email: usersArr[1].email,
        password: usersArr[1].password + '123'
      })
      .expect(400)
      .expect(res => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(usersArr[1]._id)
          .then(user => {
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch(err => done(err));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', done => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', usersArr[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(usersArr[0]._id)
          .then(user => {
            expect(user.tokens.length).toBe(0);
            done();
          })
          .catch(err => done(err));
      });
  });
});
