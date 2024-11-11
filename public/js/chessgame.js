let highlightedSquares=[]
const socket = io();
const chess = new Chess();
const boardelement = document.querySelector(".chessboard");

let draggedpiece = null;
let sourceblock = null;
let playerrole = null;

const renderBoard = () => {
    const board = chess.board();
    boardelement.innerHTML = ""; // Clear the board before rendering

    board.forEach((row, rowindex) => {
        row.forEach((square, squareidx) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareidx) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareidx;

            if (square) {
                const pieceElem = document.createElement("div");
                pieceElem.classList.add(
                    "piece",
                    square.color === 'w' ? "white" : "black"
                );
                pieceElem.innerText = getpieceUnicode(square);
                pieceElem.draggable = square.color === playerrole;

                pieceElem.addEventListener("dragstart", (e) => {
                    if (pieceElem.draggable) {
                        draggedpiece = pieceElem;
                        sourceblock = { row: rowindex, col: squareidx };
                        e.dataTransfer.setData("text/plain", "");
                        createhighlight(rowindex,squareidx)
                    }
                });

                pieceElem.addEventListener("dragend", () => {
                    draggedpiece = null;
                    sourceblock = null;
                    removehighlight()
                });
                squareElement.appendChild(pieceElem);
            }
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedpiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceblock, targetSource);
                }
            });
            boardelement.appendChild(squareElement);
        });
    });

    if(playerrole==='b'){
        boardelement.classList.add("flipped")
    }
    else{
        boardelement.classList.remove("flipped")
    }
};

const getpieceUnicode = (piece) => {
    const pieceSymbols = {
        k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙',
        K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟'
    };
    return pieceSymbols[piece.type] || "";
};

const handleMove = (sourceblock, targetSource) => {
    const move = {
        from: `${String.fromCharCode(97 + sourceblock.col)}${8 - sourceblock.row}`,
        to: `${String.fromCharCode(97 + targetSource.col)}${8 - targetSource.row}`,
        promotion: 'q' // for pawn promotion if needed
    };
    socket.emit("move", move);
};

const createhighlight=(row,col) => {
    const square=`${String.fromCharCode(97 +col)}${8 -row}`
    const possiblemoves=chess.moves({square:square,verbose:true})

    possiblemoves.forEach((move) => {
        const targetRow = 8 - parseInt(move.to[1]);
        const targetCol = move.to.charCodeAt(0) - 97;
        const targetSquare = document.querySelector(
            `.square[data-row="${targetRow}"][data-col="${targetCol}"]`
        );
        if (targetSquare) {
            targetSquare.classList.add("highlight");
            highlightedSquares.push(targetSquare);
        }
    })
}

const removehighlight = () => {
    highlightedSquares.forEach((square) => {
        square.classList.remove("highlight")
    })
    highlightedSquares=[]
}

socket.on("playerRole", (role) => {
    playerrole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerrole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard(); // Initial call to render the board
