const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const ent = require('ent') // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP
const bodyParser = require('body-parser') // Charge le middleware de sessions
const dotenv = require('dotenv')
const { Pool } = require('pg')

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

pool.on('connect', () => {
  console.log('connected to the db')
})

const port = process.env.PORT || 3000

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
  // Dès qu'on reçoit un todo, on récupère le transmet aux autres personnes
  socket.on('addtodo', function (todo) {
    todo = ent.encode(todo)
    // console.log(todo)
    const text = 'INSERT INTO todos(title) VALUES($1) RETURNING *'
    const values = [todo]
    pool.query(text, values, (err, result) => {
      if (err) {
        console.log(err.stack)
      } else {
        console.log(result.rows[0])
      }
    })

    socket.broadcast.emit('addtodo', { todo: todo })
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
    socket.broadcast.emit('removetodo', id)
  })
})

server.listen(port, function () {
  console.log('listening on *:' + port)
})
