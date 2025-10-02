import { useEffect, useRef, useState, useCallback } from "react";

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

export default function ChessBoard({ size = 500 }) {
    const canvasRef = useRef(null);
    const [images, setImages] = useState({});
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [moves, setMoves] = useState([]);

    const rows = 8;
    const cols = 8;
    const cellSize = size / 8;
    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const imageScale = 0.75;

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
            for (let i = 0; i < cols; i++) {
                ctx.fillText(String.fromCharCode(97 + i), i * cellSize + 4, size - cellSize / 5 - 2);
            }
            for (let i = 0; i < rows; i++) {
                ctx.fillText(String(8 - i), 2, i * cellSize + 2);
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
        [cellSize, size, images, draggingPiece, mousePos, moves]
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
                if (board[row][col - 1] !== null) {
                    if (board[row][col - 1].isEnpassant) {
                        newMoves.push([row - 1, col - 1]);
                    }
                }
                if (row > 0 && board[row - 1][col - 1] !== null && board[row - 1][col - 1].name[0] === "b") {
                    newMoves.push([row - 1, col - 1]);
                }
            }
            if (col < 7) {
                if (board[row][col + 1] !== null) {
                    if (board[row][col + 1].isEnpassant) {
                        newMoves.push([row - 1, col + 1]);
                    }
                }
                if (row > 0 && board[row - 1][col + 1] !== null && board[row - 1][col + 1].name[0] === "b") {
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
                    if (board[row][col - 1].isEnpassant) {
                        newMoves.push([row + 1, col - 1]);
                    }
                }
                if (row < 7 && board[row + 1][col - 1] !== null && board[row + 1][col - 1].name[0] === "w") {
                    newMoves.push([row + 1, col - 1]);
                }
            }
            if (col < 7) {
                if (board[row][col + 1] !== null) {
                    if (board[row][col + 1].isEnpassant) {
                        newMoves.push([row + 1, col + 1]);
                    }
                }
                if (row < 7 && board[row + 1][col + 1] !== null && board[row + 1][col + 1].name[0] === "w") {
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
            for (let [dr, dc] of directions) {
                let newRow = row + dr;
                let newCol = col + dc;

                if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                    const square = board[newRow][newCol];
                    if (square === null || square.name[0] === target) {
                        newMoves.push([newRow, newCol]);
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
            const directions = [
                [-1, -1], [-1, 1],
                [1, -1], [1, 1]
            ];

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
            //TODO king
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
            if (piece) {
                setDraggingPiece({ piece, row, col });
                setMousePos(pos);

                let newMoves = [];
                let whiteThreatMoves
                let blackThreatMoves
                if (piece.name[0] === "w") {
                    whiteThreatMoves = getKingThreatMoves("wk", board)
                } else {
                    blackThreatMoves = getKingThreatMoves("bk", board)
                }
                console.log(blackThreatMoves)
                switch (piece.name) {
                    case "wp":
                        newMoves = getWPawnMoves(row, col, piece.isMoved);
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "bp":
                        newMoves = getBPawnMoves(row, col, piece.isMoved);
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
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
                        break;
                    case "bk":
                        newMoves = getKingMoves(row, col, board, "w");
                        if (blackThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                blackThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
                        break;
                    case "wk":
                        newMoves = getKingMoves(row, col, board, "b");
                        if (whiteThreatMoves.length !== 0) {
                            newMoves = newMoves.filter(element =>
                                whiteThreatMoves.some(move =>
                                    move[0] === element[0] && move[1] === element[1]
                                )
                            );
                        }
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
            if (newCol !== draggingPiece.col || newRow !== draggingPiece.row) {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (board[row][col] !== null) {
                            board[row][col].isEnpassant = false;
                        }
                    }
                }
            }
            if (moves.some(([r, c]) => r === newRow && c === newCol)) {
                board[draggingPiece.row][draggingPiece.col] = null;
                draggingPiece.piece.isMoved = true;
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
                if (newRow === 7 && draggingPiece.piece.name === "bp") {
                    board[newRow][newCol] = new Piece("bq", pieceImages["bq"], 9);
                } else if (newRow === 0 && draggingPiece.piece.name === "wp") {
                    board[newRow][newCol] = new Piece("wq", pieceImages["wq"], 9);
                } else {
                    board[newRow][newCol] = draggingPiece.piece;
                }
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
    }, [images, drawBoard, draggingPiece, cellSize, moves]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-lg shadow-lg cursor-pointer"
        />
    );
}
