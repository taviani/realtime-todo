const app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP
    bodyParser = require('body-parser'); // Charge le middleware de sessions

const port = process.env.PORT || 3000;    

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const Todo = require('./models/todo');

// Chargement de la page index.ejs
app.get('/', function (req, res) {
    Todo.all((err, todos) => res.format({
    html: () => {
    res.render('index.ejs', { todos: todos});
    }
    }));
});


// Chargement de la page index.ejs
app.post('/', function (req, res) {
    Todo.all((err, todos) => res.format({
    html: () => {
    res.render('index.ejs', { todos: todos});
    }
    }));
});

io.sockets.on('connection', function (socket) {

    // Dès qu'on reçoit un todo, on récupère le transmet aux autres personnes
    socket.on('addtodo', function (todo) {
        todo = ent.encode(todo);
       // console.log(todo);
        Todo.add(todo);
        socket.broadcast.emit('addtodo', {todo: todo});
    }); 
    // Dès qu'on supprime un todo, on transmet son id aux autres personnes
    socket.on('removetodo', function (id) {
        id = ent.encode(id);
       // console.log(id);
        Todo.delete(id);
        socket.broadcast.emit('removetodo', id);
    }); 
});

server.listen(port);