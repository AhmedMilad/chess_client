import { useEffect, useRef, useState, useCallback, Fragment } from "react";

const pieceImages = {
    wp: "/assets/pieces/wp.svg",
    wr: "/assets/pieces/wr.svg",
    wn: "/assets/pieces/wn.svg",
    wb: "/assets/pieces/wb.svg",
    wq: "/assets/pieces/wq.svg",
    wk: "/assets/pieces/wk.svg",
    bp: "/assets/pieces/bp.svg",
    br: "/assets/pieces/br.svg",
    bn: "/assets/pieces/bn.svg",
    bb: "/assets/pieces/bb.svg",
    bq: "/assets/pieces/bq.svg",
    bk: "/assets/pieces/bk.svg",
};

class Piece {
    constructor(name, image, weight) {
        this.name = name;
        this.image = image;
        this.weight = weight;
        this.isEnpassant = false;
        this.isMoved = false;
        this.isPlayable = false
    }
}

let board = [
    [
        new Piece("br", pieceImages["br"], 5),
        new Piece("bn", pieceImages["bn"], 3),
        new Piece("bb", pieceImages["bb"], 3),
        new Piece("bq", pieceImages["bq"], 9),
        new Piece("bk", pieceImages["bk"], 100),
        new Piece("bb", pieceImages["bb"], 3),
        new Piece("bn", pieceImages["bn"], 3),
        new Piece("br", pieceImages["br"], 5)
    ],
    [
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
        new Piece("bp", pieceImages["bp"], 1),
    ],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
        new Piece("wp", pieceImages["wp"], 1),
    ],
    [
        new Piece("wr", pieceImages["wr"], 5),
        new Piece("wn", pieceImages["wn"], 3),
        new Piece("wb", pieceImages["wb"], 3),
        new Piece("wq", pieceImages["wq"], 9),
        new Piece("wk", pieceImages["wk"], 100),
        new Piece("wb", pieceImages["wb"], 3),
        new Piece("wn", pieceImages["wn"], 3),
        new Piece("wr", pieceImages["wr"], 5)
    ],
];

const rotateMatrix180C = source => {
    const M = source.length;
    const N = source[0].length;
    let destination = new Array(N);
    for (let i = 0; i < N; i++) {
        destination[i] = new Array(M);
    }
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            destination[i][j] = source[M - j - 1][i];
        }
    } return destination;
};

export default function ChessBoard({ size = 500 }) {
    const canvasRef = useRef(null);
    const [images, setImages] = useState({});
    const [loaded, setLoaded] = useState(false);
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [moves, setMoves] = useState([]);
    const [turn, setTurn] = useState(true)
    const [movesHistory, setMovesHistory] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [movesHistory]);

    const rows = 8;
    const cols = 8;
    const cellSize = size / 8;
    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const imageScale = 0.75;

    let isBlack = false

    if (isBlack) {
        if (!loaded) {
            board = rotateMatrix180C(board)
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    let piece = board[row][col]
                    if (piece != null && piece.name[0] === 'b') {
                        piece.isPlayable = true;
                    }
                }
            }
        }
    } else if (!loaded) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let piece = board[row][col]
                if (piece != null && piece.name[0] === 'w') {
                    piece.isPlayable = true;
                }
            }
        }
    }

    useEffect(() => {
        setLoaded(true)
    }, []);


    useEffect(() => {
        const loadedImages = {};
        let loadedCount = 0;
        const totalImages = Object.keys(pieceImages).length;

        Object.keys(pieceImages).forEach((key) => {
            const img = new Image();
            img.src = pieceImages[key];
            img.onload = () => {
                loadedImages[key] = img;
                loadedCount++;
                if (loadedCount === totalImages) {
                    setImages(loadedImages);
                }
            };
        });
    }, []);

    const drawBoard = useCallback(
        (ctx) => {
            ctx.clearRect(0, 0, size, size);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    ctx.fillStyle = (row + col) % 2 === 0 ? lightColor : darkColor;
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }

            ctx.fillStyle = "#000";
            ctx.font = `${cellSize / 5}px Arial`;
            ctx.textBaseline = "top";

            if (!isBlack) {
                for (let i = 0; i < cols; i++) {
                    ctx.fillText(String.fromCharCode(97 + i), i * cellSize + 4, size - cellSize / 5 - 2);
                }
                for (let i = 0; i < rows; i++) {
                    ctx.fillText(String(8 - i), size - cellSize / 5 - 2, i * cellSize + 2);
                }

            } else {
                for (let i = 0; i < cols; i++) {
                    ctx.fillText(String.fromCharCode(97 + (7 - i)), i * cellSize + 4, size - cellSize / 5 - 2);
                }
                for (let i = 0; i < rows; i++) {
                    ctx.fillText(String(i + 1), 2, i * cellSize + 2);
                }
            }

            ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
            moves.forEach(([row, col]) => {
                ctx.beginPath();
                ctx.arc(
                    col * cellSize + cellSize / 2,
                    row * cellSize + cellSize / 2,
                    cellSize / 4,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            });

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const piece = board[row][col];
                    if (piece && images[piece.name]) {
                        if (draggingPiece && draggingPiece.row === row && draggingPiece.col === col) continue;

                        const img = images[piece.name];
                        const aspect = img.width / img.height;
                        let imgWidth, imgHeight;
                        if (aspect > 1) {
                            imgWidth = cellSize * imageScale;
                            imgHeight = imgWidth / aspect;
                        } else {
                            imgHeight = cellSize * imageScale;
                            imgWidth = imgHeight * aspect;
                        }

                        const offsetX = (cellSize - imgWidth) / 2;
                        const offsetY = (cellSize - imgHeight) / 2;

                        ctx.drawImage(
                            img,
                            col * cellSize + offsetX,
                            row * cellSize + offsetY,
                            imgWidth,
                            imgHeight
                        );
                    }
                }
            }

            if (draggingPiece && images[draggingPiece.piece.name]) {
                const img = images[draggingPiece.piece.name];
                const aspect = img.width / img.height;
                let imgWidth, imgHeight;
                if (aspect > 1) {
                    imgWidth = cellSize * imageScale;
                    imgHeight = imgWidth / aspect;
                } else {
                    imgHeight = cellSize * imageScale;
                    imgWidth = imgHeight * aspect;
                }

                ctx.drawImage(
                    img,
                    mousePos.x - imgWidth / 2,
                    mousePos.y - imgHeight / 2,
                    imgWidth,
                    imgHeight
                );
            }
        },
        [cellSize, size, images, draggingPiece, mousePos, moves, isBlack]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");
        drawBoard(ctx);

        function getWPawnMoves(row, col, isMoved) {
            let newMoves = [];
            if (row > 0 && board[row - 1][col] === null) {
                newMoves.push([row - 1, col]);
                if (!isMoved && board[row - 2][col] === null) newMoves.push([row - 2, col]);
            }
            if (col > 0) {
                if (board[row][col - 1] !== null && board[row][col - 1].name[0] !== board[row][col].name[0]) {
                    if (board[row][col - 1].isEnpassant) {
                        newMoves.push([row - 1, col - 1]);
                    }
                }
                if (row > 0 && board[row - 1][col - 1] !== null && board[row - 1][col - 1].name[0] !== board[row][col].name[0]) {
                    newMoves.push([row - 1, col - 1]);
                }
            }
            if (col < 7) {
                if (board[row][col + 1] !== null && board[row][col + 1].name[0] !== board[row][col].name[0]) {
                    if (board[row][col + 1].isEnpassant) {
                        newMoves.push([row - 1, col + 1]);
                    }
                }
                if (row > 0 && board[row - 1][col + 1] !== null && board[row - 1][col + 1].name[0] !== board[row][col].name[0]) {
                    newMoves.push([row - 1, col + 1]);
                }
            }
            return newMoves;
        }

        function getBPawnMoves(row, col, isMoved) {
            let newMoves = [];
            if (row < 7 && board[row + 1][col] === null) {
                newMoves.push([row + 1, col]);
                if (!isMoved && board[row + 2][col] === null) newMoves.push([row + 2, col]);
            }
            if (col > 0) {
                if (board[row][col - 1] !== null) {
                    if (board[row][col - 1].name[0] !== board[row][col].name[0] && board[row][col - 1].isEnpassant) {
                        newMoves.push([row + 1, col - 1]);
                    }
                }
                if (row < 7 && board[row + 1][col - 1] !== null && board[row + 1][col - 1].name[0] !== board[row][col].name[0]) {
                    newMoves.push([row + 1, col - 1]);
                }
            }
            if (col < 7) {
                if (board[row][col + 1] !== null && board[row][col + 1] !== board[row][col].name[0]) {
                    if (board[row][col + 1].isEnpassant) {
                        newMoves.push([row + 1, col + 1]);
                    }
                }
                if (row < 7 && board[row + 1][col + 1] !== null && board[row + 1][col + 1].name[0] !== board[row][col].name[0]) {
                    newMoves.push([row + 1, col + 1]);
                }
            }
            return newMoves;
        }

        function getKnightMoves(row, col, board, target) {
            let newMoves = [];
            const directions = [
                [-2, -1], [-2, +1],
                [+2, -1], [+2, +1],
                [-1, -2], [+1, -2],
                [-1, +2], [+1, +2]
            ];

            for (let [drow, dcol] of directions) {
                let newRow = row + drow;
                let newCol = col + dcol;

                if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                    const square = board[newRow][newCol];
                    if (square === null || square.name[0] === target) {
                        newMoves.push([newRow, newCol]);
                    }
                }
            }

            return newMoves;
        }

        function isSafeSquare(row, col, board, target, isPlayable) {
            let newCol = col, newRow = row
            let rook = target + "r", bishop = target + "b", queen = target + "q", knight = target + "n", pawn = target + "p"
            while (newRow < 7) {
                newRow++
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === rook) {
                        return false
                    }
                    break
                }
            }
            newRow = row
            while (newRow > 0) {
                newRow--
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === rook) {
                        return false
                    }
                    break
                }
            }
            newRow = row
            while (newCol < 7) {
                newCol++
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === rook) {
                        return false
                    }
                    break
                }
            }
            newCol = col
            while (newCol > 0) {
                newCol--
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === rook) {
                        return false
                    }
                    break
                }
            }
            newCol = col
            while (newRow < 7 && newCol < 7) {
                newRow++
                newCol++
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === bishop) {
                        return false
                    }
                    break
                }
            }
            newRow = row
            newCol = col
            while (newRow > 0 && newCol > 0) {
                newRow--
                newCol--
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === bishop) {
                        return false
                    }
                    break
                }
            }
            newRow = row
            newCol = col
            while (newCol < 7 && newRow > 0) {
                newCol++
                newRow--
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === bishop) {
                        return false
                    }
                    break
                }
            }
            newRow = row
            newCol = col
            while (newCol > 0 && newRow < 7) {
                newRow++
                newCol--
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === queen || piece.name === bishop) {
                        return false
                    }
                    break
                }
            }

            let knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ]
            for (let i = 0; i < knightMoves.length; i++) {
                let dr = knightMoves[i][0], dc = knightMoves[i][1]
                let r = row + dr, c = col + dc
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                    let piece = board[r][c]
                    if (piece != null && piece.name === knight) return false
                }
            }

            let pawnRow = isPlayable ? row - 1 : row + 1;
            for (let pawnCol of [col - 1, col + 1]) {
                if (pawnRow >= 0 && pawnRow <= 7 && pawnCol >= 0 && pawnCol <= 7) {
                    let piece = board[pawnRow][pawnCol];
                    if (piece != null && piece.name === pawn) return false;
                }
            }
            let king = target + "k";
            const kingMoves = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            for (let [dr, dc] of kingMoves) {
                let r = row + dr, c = col + dc;
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                    let piece = board[r][c];
                    if (piece != null && piece.name === king) return false;
                }
            }
            return true
        }

        function getKingMoves(row, col, board, target) {
            let newMoves = [];
            const directions = [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1]
            ];

            let piece = board[row][col]

            for (let [dr, dc] of directions) {
                let newRow = row + dr;
                let newCol = col + dc;

                if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                    const square = board[newRow][newCol];
                    if (square === null || square.name[0] === target) {
                        if (isSafeSquare(newRow, newCol, board, target, piece.isPlayable)) {

                            let validMove = true;
                            let checkRow = row - dr;
                            let checkCol = col - dc;

                            while (checkRow >= 0 && checkRow <= 7 && checkCol >= 0 && checkCol <= 7) {
                                const threatSquare = board[checkRow][checkCol];
                                if (threatSquare !== null && threatSquare.name[0] === target) {
                                    const pieceType = threatSquare.name[1];
                                    if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
                                        if (pieceType === 'b' || pieceType === 'q') {
                                            validMove = false;
                                            break;
                                        }
                                    } else {
                                        if (pieceType === 'r' || pieceType === 'q') {
                                            validMove = false;
                                            break;
                                        }
                                    }
                                    break;
                                }
                                checkRow -= dr;
                                checkCol -= dc;
                            }
                            if (validMove) newMoves.push([newRow, newCol]);
                        }
                    }
                }
            }
            let king = board[row][col]
            if (!king.isMoved) {
                let newCol = col
                let exists = newMoves.some(move =>
                    move[0] === row && move[1] === col - 1
                );
                if (exists) {
                    while (newCol > 0) {
                        newCol--
                        let piece = board[row][newCol]
                        if (piece != null) {
                            if (piece.name[0] === king.name[0] && piece.name[1] === 'r' && !piece.isMoved) {
                                if (isSafeSquare(row, col - 2, board, target, piece.isPlayable)) {
                                    newMoves.push([row, col - 2]);
                                }
                            }
                            break
                        }
                    }
                }
                newCol = col
                exists = newMoves.some(move =>
                    move[0] === row && move[1] === col + 1
                );
                if (exists) {
                    while (newCol < 7) {
                        newCol++
                        let piece = board[row][newCol]
                        if (piece != null) {
                            if (piece.name[0] === king.name[0] && piece.name[1] === 'r' && !piece.isMoved) {
                                if (isSafeSquare(row, col + 2, board, target, piece.isPlayable)) {
                                    newMoves.push([row, col + 2]);
                                }
                            }
                            break
                        }
                    }
                }
            }
            return newMoves;
        }

        function getVerticalMoves(row, col, board, target) {
            let newMoves = []
            let newRow = row
            while (newRow < 7) {
                newRow++
                if (board[newRow][col] === null) {
                    newMoves.push([newRow, col]);
                } else {
                    if (board[newRow][col].name[0] === target) {
                        newMoves.push([newRow, col]);
                    }
                    break;
                }
            }
            newRow = row
            while (newRow > 0) {
                newRow--
                if (board[newRow][col] === null) {
                    newMoves.push([newRow, col]);
                } else {
                    if (board[newRow][col].name[0] === target) {
                        newMoves.push([newRow, col]);
                    }
                    break;
                }
            }
            return newMoves
        }

        function getHorizontalMoves(row, col, board, target) {
            let newMoves = []
            let newCol = col
            while (newCol < 7) {
                newCol++
                if (board[row][newCol] === null) {
                    newMoves.push([row, newCol]);
                } else {
                    if (board[row][newCol].name[0] === target) {
                        newMoves.push([row, newCol]);
                    }
                    break;
                }
            }
            newCol = col
            while (newCol > 0) {
                newCol--
                if (board[row][newCol] === null) {
                    newMoves.push([row, newCol]);
                } else {
                    if (board[row][newCol].name[0] === target) {
                        newMoves.push([row, newCol]);
                    }
                    break;
                }
            }
            return newMoves
        }

        function getMainDiagonal(row, col, board, target) {
            let newMoves = []
            let newCol = col
            let newRow = row
            while (newCol < 7 && newRow < 7) {
                newCol++
                newRow++
                if (board[newRow][newCol] === null) {
                    newMoves.push([newRow, newCol]);
                } else {
                    if (board[newRow][newCol].name[0] === target) {
                        newMoves.push([newRow, newCol]);
                    }
                    break;
                }
            }
            newCol = col
            newRow = row
            while (newCol > 0 && newRow > 0) {
                newCol--
                newRow--
                if (board[newRow][newCol] === null) {
                    newMoves.push([newRow, newCol]);
                } else {
                    if (board[newRow][newCol].name[0] === target) {
                        newMoves.push([newRow, newCol]);
                    }
                    break;
                }
            }
            return newMoves
        }

        function getAntiDiagonal(row, col, board, target) {
            let newMoves = []
            let newCol = col
            let newRow = row
            while (newCol < 7 && newRow > 0) {
                newCol++
                newRow--
                if (board[newRow][newCol] === null) {
                    newMoves.push([newRow, newCol]);
                } else {
                    if (board[newRow][newCol].name[0] === target) {
                        newMoves.push([newRow, newCol]);
                    }
                    break;
                }
            }
            newCol = col
            newRow = row
            while (newRow < 7 && newCol > 0) {
                newCol--
                newRow++
                if (board[newRow][newCol] === null) {
                    newMoves.push([newRow, newCol]);
                } else {
                    if (board[newRow][newCol].name[0] === target) {
                        newMoves.push([newRow, newCol]);
                    }
                    break;
                }
            }
            return newMoves
        }

        function getHorizontalThreat(row, col, board, targets = []) {
            let newMoves = []
            let curMoves = []
            let newCol = col
            while (newCol < 7) {
                newCol++
                if (board[row][newCol] === null) {
                    curMoves.push([row, newCol]);
                } else {
                    if (targets.includes(board[row][newCol].name)) {
                        curMoves.push([row, newCol]);
                        newMoves = newMoves.concat(curMoves)
                    }
                    break;
                }
            }
            curMoves = []
            newCol = col
            while (newCol > 0) {
                newCol--
                if (board[row][newCol] === null) {
                    curMoves.push([row, newCol]);
                } else {
                    if (targets.includes(board[row][newCol].name)) {
                        curMoves.push([row, newCol]);
                        newMoves = newMoves.concat(curMoves)
                    }
                    break;
                }
            }
            return newMoves
        }

        function getVerticalThreat(row, col, board, targets = []) {
            let newMoves = []
            let curMoves = []
            let newRow = row
            while (newRow < 7) {
                newRow++
                if (board[newRow][col] === null) {
                    curMoves.push([newRow, col]);
                } else {
                    if (targets.includes(board[newRow][col].name)) {
                        curMoves.push([newRow, col]);
                        newMoves = newMoves.concat(curMoves)
                    }
                    break;
                }
            }
            curMoves = []
            newRow = row
            while (newRow > 0) {
                newRow--
                if (board[newRow][col] === null) {
                    curMoves.push([newRow, col]);
                } else {
                    if (targets.includes(board[newRow][col].name)) {
                        curMoves.push([newRow, col]);
                        newMoves = newMoves.concat(curMoves)
                    }
                    break;
                }
            }
            return newMoves
        }

        function getPawnThreat(row, col, board, target) {
            let directions = [
                [1, -1], [1, 1]
            ];
            let pawn = board[row][col]
            if (pawn.isPlayable) {
                directions = [
                    [-1, -1], [-1, 1],
                ]
            }
            const newMoves = [];
            directions.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (
                    newRow >= 0 && newRow <= 7 &&
                    newCol >= 0 && newCol <= 7
                ) {
                    const piece = board[newRow][newCol];
                    if (piece && piece.name === target) {
                        newMoves.push([newRow, newCol]);
                    }
                }
            });

            return newMoves;
        }

        function getMainDiagonalThreat(row, col, board, targets = []) {
            let newMoves = []
            let curMoves = []
            let newCol = col
            let newRow = row
            while (newCol < 7 && newRow < 7) {
                newCol++
                newRow++
                if (board[newRow][newCol] === null) {
                    curMoves.push([newRow, newCol]);
                } else {
                    if (targets.includes(board[newRow][newCol].name)) {
                        curMoves.push([newRow, newCol]);
                        newMoves = newMoves.concat(curMoves)
                    }
                    break;
                }
            }
            newCol = col
            newRow = row
            curMoves = []
            while (newCol > 0 && newRow > 0) {
                newCol--
                newRow--
                if (board[newRow][newCol] === null) {
                    curMoves.push([newRow, newCol]);
                } else {
                    if (targets.includes(board[newRow][newCol].name)) {
                        curMoves.push([newRow, newCol]);
                        newMoves = newMoves.concat(curMoves)
                    }
                    break;
                }
            }
            return newMoves
        }

        function getAntiDiagonalThreat(row, col, board, targets = []) {
            let newMoves = []
            let curMoves = []
            let newCol = col
            let newRow = row
            while (newCol < 7 && newRow > 0) {
                newCol++
                newRow--
                if (board[newRow][newCol] === null) {
                    curMoves.push([newRow, newCol]);
                } else {
                    if (targets.includes(board[newRow][newCol].name)) {
                        curMoves.push([newRow, newCol]);
                        newMoves = newMoves.concat(curMoves);
                    }
                    break;
                }
            }
            newCol = col
            newRow = row
            curMoves = []
            while (newRow < 7 && newCol > 0) {
                newCol--
                newRow++
                if (board[newRow][newCol] === null) {
                    curMoves.push([newRow, newCol]);
                } else {
                    if (targets.includes(board[newRow][newCol].name)) {
                        curMoves.push([newRow, newCol]);
                        newMoves = newMoves.concat(curMoves);
                    }
                    break;
                }
            }
            return newMoves
        }

        function getKingThreatMoves(target, board) {
            let kingRow = 0;
            let kingCol = 0;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (board[row][col] !== null && board[row][col].name === target) {
                        kingRow = row
                        kingCol = col
                    }
                }
            }
            let targetCol
            if (target[0] === "w") {
                targetCol = "b"
            } else {
                targetCol = "w"
            }
            let rook = targetCol + "r", bishop = targetCol + "b", queen = targetCol + "q", knight = targetCol + "n", pawn = targetCol + "p"
            let threatMoves = getVerticalThreat(kingRow, kingCol, board, [rook, queen])
                .concat(getHorizontalThreat(kingRow, kingCol, board, [rook, queen]))
                .concat(getMainDiagonalThreat(kingRow, kingCol, board, [bishop, queen]))
                .concat(getAntiDiagonalThreat(kingRow, kingCol, board, [bishop, queen]))
                .concat(getKnightThreatMoves(kingRow, kingCol, board, knight))
                .concat(getPawnThreat(kingRow, kingCol, board, pawn))
            return threatMoves
        }

        function getKnightThreatMoves(row, col, board, target) {
            let threatMoves = [];
            const directions = [
                [-2, -1], [-2, +1],
                [+2, -1], [+2, +1],
                [-1, -2], [+1, -2],
                [-1, +2], [+1, +2]
            ];

            for (let [drow, dcol] of directions) {
                let newRow = row + drow;
                let newCol = col + dcol;

                if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                    const piece = board[newRow][newCol];
                    if (piece !== null && piece.name === target) {
                        threatMoves.push([newRow, newCol]);
                    }
                }
            }

            return threatMoves;
        }

        function getPinMoves(row, col, board) {
            let pinMoves = getMainDiagonalPinMoves(row, col, board)
                .concat(getAntiDiagonalPinMoves(row, col, board))
                .concat(getHorizontalPinMoves(row, col, board))
                .concat(getVerticalPinMoves(row, col, board))
            return pinMoves
        }

        function getMainDiagonalPinMoves(row, col, board) {
            if (board[row][col] == null) return []
            let pinMoves = []
            let newCol = col, newRow = row;
            let isThreat = false, isKing = false
            let kingCol = board[row][col].name[0], threatCol = 'w'
            if (kingCol === 'w') {
                threatCol = 'b'
            }
            let king = kingCol + "k", queen = threatCol + 'q', bishop = threatCol + "b"
            while (newCol > 0 && newRow > 0) {
                newCol--
                newRow--
                pinMoves.push([newRow, newCol]);
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === bishop || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (!isKing && !isThreat) {
                return []
            }
            newCol = col
            newRow = row
            while (newCol < 7 && newRow < 7) {
                newCol++
                newRow++
                pinMoves.push([newRow, newCol]);
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === bishop || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (isKing && isThreat) {
                return pinMoves
            }
            return []
        }

        function getAntiDiagonalPinMoves(row, col, board) {
            if (board[row][col] == null) return []
            let pinMoves = []
            let newCol = col, newRow = row;
            let isThreat = false, isKing = false
            let kingCol = board[row][col].name[0], threatCol = 'w'
            if (kingCol === 'w') {
                threatCol = 'b'
            }
            let king = kingCol + "k", queen = threatCol + 'q', bishop = threatCol + "b"
            while (newCol < 7 && newRow > 0) {
                newCol++
                newRow--
                pinMoves.push([newRow, newCol]);
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === bishop || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (!isKing && !isThreat) {
                return []
            }
            newCol = col
            newRow = row
            while (newRow < 7 && newCol > 0) {
                newCol--
                newRow++
                pinMoves.push([newRow, newCol]);
                if (board[newRow][newCol] != null) {
                    let piece = board[newRow][newCol]
                    if (piece.name === bishop || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (isKing && isThreat) {
                return pinMoves
            }
            return []
        }

        function getVerticalPinMoves(row, col, board) {
            if (board[row][col] == null) return []
            let pinMoves = []
            let newRow = row;
            let isThreat = false, isKing = false
            let kingCol = board[row][col].name[0], threatCol = 'w'
            if (kingCol === 'w') {
                threatCol = 'b'
            }
            let king = kingCol + "k", queen = threatCol + 'q', rook = threatCol + "r"
            while (newRow > 0) {
                newRow--
                pinMoves.push([newRow, col]);
                if (board[newRow][col] != null) {
                    let piece = board[newRow][col]
                    if (piece.name === rook || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (!isKing && !isThreat) {
                return []
            }
            newRow = row
            while (newRow < 7) {
                newRow++
                pinMoves.push([newRow, col]);
                if (board[newRow][col] != null) {
                    let piece = board[newRow][col]
                    if (piece.name === rook || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (isKing && isThreat) {
                return pinMoves
            }
            return []
        }

        function getHorizontalPinMoves(row, col, board) {
            if (board[row][col] == null) return []
            let pinMoves = []
            let newCol = col
            let isThreat = false, isKing = false
            let kingCol = board[row][col].name[0], threatCol = 'w'
            if (kingCol === 'w') {
                threatCol = 'b'
            }
            let king = kingCol + "k", queen = threatCol + 'q', rook = threatCol + "r"
            while (newCol < 7) {
                newCol++
                pinMoves.push([row, newCol]);
                if (board[row][newCol] != null) {
                    let piece = board[row][newCol]
                    if (piece.name === rook || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (!isKing && !isThreat) {
                return []
            }
            newCol = col
            while (newCol > 0) {
                newCol--
                pinMoves.push([row, newCol]);
                if (board[row][newCol] != null) {
                    let piece = board[row][newCol]
                    if (piece.name === rook || piece.name === queen) {
                        isThreat = true
                    }
                    if (piece.name === king) {
                        isKing = true
                    }
                    break
                }
            }
            if (isKing && isThreat) {
                return pinMoves
            }
            return []
        }

        function getNumberOfChecks(board, target) {
            let kingRow = -1, kingCol = -1, king = target + 'k'
            let kingIsFound = false
            for (let row = 0; row <= 7; row++) {
                for (let col = 0; col <= 7; col++) {
                    let piece = board[row][col]
                    if (piece != null && piece.name === king) {
                        kingRow = row
                        kingCol = col
                        kingIsFound = true
                        break
                    }
                }
                if (kingRow !== -1) break
            }
            let numberOfChecks = 0
            if (kingIsFound) {
                numberOfChecks += getMainDiagonalCheck(kingRow, kingCol, board)
                numberOfChecks += getAntiDiagonalCheck(kingRow, kingCol, board)
                numberOfChecks += getVerticalCheck(kingRow, kingCol, board)
                numberOfChecks += getHorizontalCheck(kingRow, kingCol, board)
                numberOfChecks += getKnightCheck(kingRow, kingCol, board)
                numberOfChecks += getPawnCheck(kingRow, kingCol, board)
            }
            return numberOfChecks
        }

        function getMainDiagonalCheck(row, col, board) {
            let newRow = row, newCol = col
            let king = board[row][col]
            let targetCol = 'w'
            if (king.name[0] === 'w') {
                targetCol = 'b'
            }
            let queen = targetCol + 'q', bishop = targetCol + 'b', checks = 0
            while (newRow > 0 && newCol > 0) {
                newRow--
                newCol--
                let piece = board[newRow][newCol]
                if (piece != null) {
                    if ([queen, bishop].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            newRow = row
            newCol = col
            while (newRow < 7 && newCol < 7) {
                newRow++
                newCol++
                let piece = board[newRow][newCol]
                if (piece != null) {
                    if ([queen, bishop].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            return checks
        }

        function getAntiDiagonalCheck(row, col, board) {
            let newRow = row, newCol = col
            let king = board[row][col]
            let targetCol = 'w'
            if (king.name[0] === 'w') {
                targetCol = 'b'
            }
            let queen = targetCol + 'q', bishop = targetCol + 'b', checks = 0
            while (newRow > 0 && newCol < 7) {
                newRow--
                newCol++
                let piece = board[newRow][newCol]
                if (piece != null) {
                    if ([queen, bishop].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            newRow = row
            newCol = col
            while (newCol > 0 && newRow < 7) {
                newRow++
                newCol--
                let piece = board[newRow][newCol]
                if (piece != null) {
                    if ([queen, bishop].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            return checks
        }

        function getVerticalCheck(row, col, board) {
            let newRow = row
            let king = board[row][col]
            let targetCol = 'w'
            if (king.name[0] === 'w') {
                targetCol = 'b'
            }
            let queen = targetCol + 'q', rook = targetCol + 'r', checks = 0
            while (newRow > 0) {
                newRow--
                let piece = board[newRow][col]
                if (piece != null) {
                    if ([queen, rook].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            newRow = row
            while (newRow < 7) {
                newRow++
                let piece = board[newRow][col]
                if (piece != null) {
                    if ([queen, rook].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            return checks
        }

        function getHorizontalCheck(row, col, board) {
            let newCol = col
            let king = board[row][col]
            let targetCol = 'w'
            if (king.name[0] === 'w') {
                targetCol = 'b'
            }
            let queen = targetCol + 'q', rook = targetCol + 'r', checks = 0
            while (newCol < 7) {
                newCol++
                let piece = board[row][newCol]
                if (piece != null) {
                    if ([queen, rook].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            newCol = col
            while (newCol > 0) {
                newCol--
                let piece = board[row][newCol]
                if (piece != null) {
                    if ([queen, rook].includes(piece.name)) {
                        checks++
                    }
                    break
                }
            }
            return checks
        }

        function getKnightCheck(row, col, board) {
            let king = board[row][col]
            let targetCol = (king.name[0] === 'w') ? 'b' : 'w'
            let knight = targetCol + 'n'
            let checks = 0

            let knightMoves = [
                [-2, -1], [-2, +1],
                [-1, -2], [-1, +2],
                [+1, -2], [+1, +2],
                [+2, -1], [+2, +1]
            ]

            for (let [dr, dc] of knightMoves) {
                let newRow = row + dr
                let newCol = col + dc
                if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                    let piece = board[newRow][newCol]
                    if (piece && piece.name === knight) {
                        checks++
                    }
                }
            }

            return checks
        }


        function getPawnCheck(row, col, board) {
            let king = board[row][col]
            let targetCol = (king.name[0] === 'w') ? 'b' : 'w'
            let pawn = targetCol + 'p'
            let checks = 0

            let direction = (!king.isPlayable) ? +1 : -1

            let attackSquares = [
                [row + direction, col - 1],
                [row + direction, col + 1]
            ]

            for (let [newRow, newCol] of attackSquares) {
                if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                    let piece = board[newRow][newCol]
                    if (piece && piece.name === pawn) {
                        checks++
                    }
                }
            }

            return checks
        }

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const handleMouseDown = (e) => {
            const pos = getMousePos(e);
            const col = Math.floor(pos.x / cellSize);
            const row = Math.floor(pos.y / cellSize);
            const piece = board[row][col];
            if (piece && piece.isPlayable === turn) {
                setDraggingPiece({ piece, row, col });
                setMousePos(pos);

                let newMoves = [];
                let whiteThreatMoves
                let blackThreatMoves
                let pinMoves = getPinMoves(row, col, board)
                if (piece.name[0] === "w") {
                    whiteThreatMoves = getKingThreatMoves("wk", board)
                } else {
                    blackThreatMoves = getKingThreatMoves("bk", board)
                }
                switch (piece.name) {
                    case "wp":
                        if (piece.isPlayable) {
                            newMoves = getWPawnMoves(row, col, piece.isMoved);
                        } else {
                            newMoves = getBPawnMoves(row, col, piece.isMoved);
                        }
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "bp":
                        if (piece.isPlayable) {
                            newMoves = getWPawnMoves(row, col, piece.isMoved);
                        } else {
                            newMoves = getBPawnMoves(row, col, piece.isMoved);
                        }
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "bn":
                        newMoves = getKnightMoves(row, col, board, "w");
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "wn":
                        newMoves = getKnightMoves(row, col, board, "b");
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "bk":
                        newMoves = getKingMoves(row, col, board, "w");
                        break;
                    case "wk":
                        newMoves = getKingMoves(row, col, board, "b");
                        break;
                    case "br":
                        newMoves = getVerticalMoves(row, col, board, "w")
                            .concat(getHorizontalMoves(row, col, board, "w"))
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "wr":
                        newMoves = getVerticalMoves(row, col, board, "b")
                            .concat(getHorizontalMoves(row, col, board, "b"));
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "bb":
                        newMoves = getMainDiagonal(row, col, board, "w")
                            .concat(getAntiDiagonal(row, col, board, "w"));
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "wb":
                        newMoves = getMainDiagonal(row, col, board, "b")
                            .concat(getAntiDiagonal(row, col, board, "b"));
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "wq":
                        newMoves = getMainDiagonal(row, col, board, "b")
                            .concat(getAntiDiagonal(row, col, board, "b"))
                            .concat(getVerticalMoves(row, col, board, "b"))
                            .concat(getHorizontalMoves(row, col, board, "b"));
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "bq":
                        newMoves = getMainDiagonal(row, col, board, "w")
                            .concat(getAntiDiagonal(row, col, board, "w"))
                            .concat(getVerticalMoves(row, col, board, "w"))
                            .concat(getHorizontalMoves(row, col, board, "w"));
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        if (pinMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                pinMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    default:
                        console.log("Invalid piece name");
                }
                setMoves(newMoves);
            }
        };

        const handleMouseMove = (e) => {
            if (!draggingPiece) return;
            const pos = getMousePos(e);
            setMousePos(pos);
            drawBoard(ctx);
        };

        const handleMouseUp = (e) => {
            if (!draggingPiece) return;
            const pos = getMousePos(e);
            const newCol = Math.floor(pos.x / cellSize);
            const newRow = Math.floor(pos.y / cellSize);
            if (moves.some(([r, c]) => r === newRow && c === newCol)) {
                if (newCol !== draggingPiece.col || newRow !== draggingPiece.row) {
                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < cols; col++) {
                            if (board[row][col] !== null) {
                                board[row][col].isEnpassant = false;
                            }
                        }
                    }
                }
                board[draggingPiece.row][draggingPiece.col] = null;
                draggingPiece.piece.isMoved = true;
                if (draggingPiece.piece.name[1] === 'k') {
                    let dc = newCol - draggingPiece.col;
                    if (Math.abs(dc) === 2) {
                        if (dc > 0) {
                            [board[draggingPiece.row][7], board[draggingPiece.row][newCol - 1]] =
                                [board[draggingPiece.row][newCol - 1], board[draggingPiece.row][7]];
                            board[draggingPiece.row][newCol - 1].isMoved = true
                        } else {
                            [board[draggingPiece.row][0], board[draggingPiece.row][newCol + 1]] =
                                [board[draggingPiece.row][newCol + 1], board[draggingPiece.row][0]];
                            board[draggingPiece.row][newCol + 1].isMoved = true
                        }
                    }
                }

                if (draggingPiece.piece.name === "wp" || draggingPiece.piece.name === "bp") {
                    if (draggingPiece.col !== newCol) {
                        if (board[newRow][newCol] === null) {
                            board[draggingPiece.row][newCol] = null
                        }
                    }
                    if (Math.abs(draggingPiece.row - newRow) === 2) {
                        draggingPiece.piece.isEnpassant = true
                    }
                }
                let queen = draggingPiece.piece.name[0] + "q"
                if (newRow === 7 && !draggingPiece.piece.isPlayable && draggingPiece.piece.name[1] === 'p') {
                    board[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                } else if (newRow === 0 && draggingPiece.piece.isPlayable && draggingPiece.piece.name[1] === 'p') {
                    board[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                } else {
                    board[newRow][newCol] = draggingPiece.piece;
                }
                let targetCol = draggingPiece.piece.name[0]
                targetCol = (targetCol === 'w') ? 'b' : 'w'
                let numberOfChecks = getNumberOfChecks(board, targetCol)
                let antiTarget = (targetCol === 'w') ? 'b' : 'w'
                let kingIsFound = false
                if (numberOfChecks > 1) {
                    let kingCol = -1, kingRow = -1, king = targetCol + 'k'
                    for (let row = 0; row <= 7; row++) {
                        for (let col = 0; col <= 7; col++) {
                            let piece = board[row][col]
                            if (piece != null && piece.name === king) {
                                kingCol = col
                                kingRow = row
                                kingIsFound = true
                                break
                            }
                        }
                        if (kingRow !== -1) break
                    }
                    if (kingIsFound) {
                        let newMoves = getKingMoves(kingRow, kingCol, board, antiTarget)
                        if (newMoves.length === 0) {
                            alert("Check mate!")
                        }
                    }
                }
                queen = targetCol + 'q'
                let pawn = targetCol + 'p'
                let rook = targetCol + 'r'
                let bishop = targetCol + 'b'
                let knight = targetCol + 'n'
                let king = targetCol + 'k'
                let threats = getKingThreatMoves(king, board)
                let totalAvailableMoves = 0

                for (let row = 0; row <= 7; row++) {
                    for (let col = 0; col <= 7; col++) {
                        let piece = board[row][col]
                        if (piece != null && [king, queen, rook, bishop, knight, pawn].includes(piece.name)) {

                            let pinMoves = getPinMoves(row, col, board)
                            let moves = []

                            switch (piece.name) {
                                case king:
                                    moves = getKingMoves(row, col, board, antiTarget)
                                    break;
                                case queen:
                                    moves = getMainDiagonal(row, col, board, antiTarget)
                                        .concat(getAntiDiagonal(row, col, board, antiTarget))
                                        .concat(getVerticalMoves(row, col, board, antiTarget))
                                        .concat(getHorizontalMoves(row, col, board, antiTarget));
                                    break;
                                case rook:
                                    moves = getVerticalMoves(row, col, board, antiTarget)
                                        .concat(getHorizontalMoves(row, col, board, antiTarget))
                                    break;
                                case bishop:
                                    moves = getMainDiagonal(row, col, board, antiTarget)
                                        .concat(getAntiDiagonal(row, col, board, antiTarget));
                                    break;
                                case knight:
                                    moves = getKnightMoves(row, col, board, antiTarget);
                                    break;
                                case pawn:
                                    moves = piece.isPlayable
                                        ? getWPawnMoves(row, col, piece.isMoved)
                                        : getBPawnMoves(row, col, piece.isMoved);
                                    break;
                                default: console.log("Invalid piece.")
                            }

                            if (piece.name !== king) {

                                if (threats.length !== 0) {
                                    moves = moves.filter(move =>
                                        threats.some(t => t[0] === move[0] && t[1] === move[1])
                                    );
                                }

                                if (pinMoves.length !== 0) {
                                    moves = moves.filter(move =>
                                        pinMoves.some(p => p[0] === move[0] && p[1] === move[1])
                                    );
                                }
                            }

                            totalAvailableMoves += moves.length
                        }
                    }
                }

                if (totalAvailableMoves === 0) {
                    if (numberOfChecks === 1) {
                        alert("Check mate!");
                    } else {
                        alert("Stalemate!");
                    }
                }

                setTurn(!turn)
                setMovesHistory(prev => [...prev, getNotation(newRow, newCol, !isBlack)]);
            }
            setDraggingPiece(null);
            setMoves([]);
            drawBoard(ctx);
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
        };
    }, [images, drawBoard, draggingPiece, cellSize, moves, turn, setTurn, setMovesHistory, isBlack]);

    function getNotation(row, col, isWhite) {
        let rank, file;

        if (isWhite) {
            rank = 8 - row;
            file = String.fromCharCode(97 + col);
        } else {
            rank = row + 1;
            file = String.fromCharCode(104 - col);
        }

        return file + rank.toString();
    }

    return (
        <div className="flex flex items-center justify-center bg-gray-900 mt-8">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded-lg shadow-lg cursor-pointer"
            />
            <div className="w-96 mx-4 bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden">
                <div className="bg-gray-700 text-white p-2 text-center font-semibold">
                    Moves
                </div>

                <div
                    ref={scrollRef}
                    className="h-72 overflow-y-auto"
                >
                    <div className="grid grid-cols-2 text-white">
                        <div className="bg-gray-700 border border-gray-600 text-center font-bold py-1">White</div>
                        <div className="bg-gray-700 border border-gray-600 text-center font-bold py-1">Black</div>

                        {movesHistory.map((move, index) => {
                            if (index % 2 === 0) {
                                return (
                                    <Fragment key={index}>
                                        <div className="border border-gray-600 text-center py-1">{move}</div>
                                        <div className="border border-gray-600 text-center py-1">
                                            {movesHistory[index + 1] || ""}
                                        </div>
                                    </Fragment>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
