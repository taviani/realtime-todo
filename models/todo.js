const sqlite3 = require('sqlite3')
const db = new sqlite3.Database(':memory:')

db.serialize(() => {
  const sql = 'CREATE TABLE IF NOT EXISTS todos (id integer primary key, title)'
  db.run(sql)
})

class Todo {
  constructor (id, title) {
    this.id = id
    this.title = title
  }

  static all (callback) {
    db.all('SELECT * FROM todos', callback)
  }

  static add (todo) {
    const sql = 'INSERT INTO todos(title) VALUES(?)'
    db.run(sql, todo)
  }

  static delete (id) {
    var sql = 'DELETE FROM todos WHERE id = ?'
    db.run(sql, id)
  }
}

module.exports = Todo
