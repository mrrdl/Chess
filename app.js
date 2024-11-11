const express = require('express');
const http = require('http');
const { Chess } = require('chess.js');  // Ensure correct import
const socket = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();  // Correct initialization of Chess instance

const players = {};
let currplayer = 'w';

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess game" });
});

io.on("connection", (uniquesocket) => {
    console.log("connected");
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", function (move) {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currplayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());  // Correct usage of chess.fen()
            } else {
                console.log("Invalid move:", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log("Error handling move:", err);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, function () {
    console.log("Listening on port 3000");
});
