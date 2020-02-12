const app = require('express')()
const express = require('express')
const path = require('path')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const ent = require('ent') // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP
const bodyParser = require('body-parser') // Charge le middleware de sessions
const dotenv = require('dotenv')
const { Pool } = require('pg')
const randomId = require('uuid/v1')

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
})

// pool.on('connect', () => {
//   console.log('connected to the db')
// })

const port = process.env.PORT || 3000

// public directory
app.use(express.static(path.join(__dirname, '/public')))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Chargement de la page index.ejs
app.get('/', (req, res) => {
  pool.query('SELECT * FROM todos', (err, result) => {
    if (err) {
      console.log(err.stack)
    } else {
      res.format({
        html: () => {
          res.render('index.ejs', { todos: result.rows })
        }
      })
    }
  })
})

io.on('connection', function (socket) {
  // Dès qu'on modifie un todo, on transmet son id aux autres personnes
  socket.on('changetodo', function (todo) {
    const id = ent.encode(todo.id)
    const etat = ent.encode(todo.etat)

    const text = 'UPDATE todos SET etat = $2 WHERE id = $1'
    const values = [id, etat]
    pool.query(text, values, (err) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log('value modified : ' + id + ' nouvel état : ' + etat)
      }
    })
    io.emit('changetodo', todo)
  })

  // Dès qu'on reçoit un todo, on récupère et le transmet aux autres personnes
  socket.on('addtodo', function (todo) {
    const title = ent.encode(todo.title)
    const id = randomId()
    // console.log(todo)
    const text = 'INSERT INTO todos(title, id, etat) VALUES($1, $2, $3) RETURNING *'
    const values = [ent.decode(title), id, true]
    pool.query(text, values, (err, result) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log(result.rows[0])
      }
    })
    todo.id = id
    io.emit('displaytodo', todo)
  })

  // Dès qu'on supprime un todo, on transmet son id aux autres personnes
  socket.on('removetodo', function (id) {
    id = ent.encode(id)
    // console.log(id)
    const text = 'DELETE FROM todos WHERE id = $1'
    const values = [id]
    pool.query(text, values, (err) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log('value deleted : ' + id)
      }
    })
    io.emit('removetodo', id)
  })
})

server.listen(port, function () {
  console.log('listening on *:' + port)
})
