import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { socket, sendMessage } from "../utils/websocket";

import {
    Piece,
    pieceImages,
    getBoard,
    getKingThreatMoves,
    getBPawnMoves,
    getWPawnMoves,
    getPinMoves,
    getKnightMoves,
    getKingMoves,
    getVerticalMoves,
    getHorizontalMoves,
    getMainDiagonal,
    getAntiDiagonal,
    getWPawnPreMoves,
    getBPawnPreMoves,
    getKnightPreMoves,
    getKingPreMoves,
    getHorizontalPreMoves,
    getVerticalPreMoves,
    getMainDiagonalPreMoves,
    getAntiDiagonalPreMoves,
    getNumberOfChecks,
    getFenFromBoard,
    getNotation,
    notationToIndex
} from "../utils/game"

export default function ChessBoard({ size = 750, message }) {

    const gameId = message.game_id

    const [opponentMove, setOpponentMove] = useState(null)
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            setOpponentMove(data);
        };

        socket.addEventListener("message", handleMessage);

        return () => {
            socket.removeEventListener("message", handleMessage);
        };
    }, []);

    const isBlack = message.is_black
    const [board, setBoard] = useState(getBoard(isBlack))

    const canvasRef = useRef(null);
    const [images, setImages] = useState({});
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [moves, setMoves] = useState([]);
    const [turn, setTurn] = useState(!isBlack)
    const [isCheckMate, setIsCheckMate] = useState(false)
    const [isDraw, setIsDraw] = useState(false)
    const [isRightDragging, setIsRightDragging] = useState(false);
    const [startPos, setStartPos] = useState(null);
    const [lines, setLines] = useState([]);
    const [preMoves, setPreMoves] = useState([]);
    const [previousMove, setPreviousMove] = useState([]);
    const [previousRightClickCords, setPreviousRightClickCords] = useState([]);
    const [currentPiece, setCurrentPiece] = useState(null);
    const [boardPosition, setBoardPosition] = useState(() => {
        const boardPosition = localStorage.getItem("boardPosition");
        return boardPosition ? JSON.parse(boardPosition) : [];
    });
    const [winner, setWinner] = useState()
    const [movesHistory, setMovesHistory] = useState([]);
    const scrollRef = useRef(null);
    const [boardCol, setBoardCol] = useState(Array.from({ length: 16 }, () => Array(16).fill(0)));
    const [highlightBoard, setHighLightBoard] = useState(Array.from({ length: 16 }, () => Array(16).fill(false)));
    const [whiteTime, setWhiteTime] = useState(300);
    const [blackTime, setBlackTime] = useState(300);

    useEffect(() => {
        if (!opponentMove) return;

        console.log("Opponent Move:", opponentMove);

        const { from, to } = opponentMove.data;

        let fromIndexes = notationToIndex(from, isBlack);
        let toIndexes = notationToIndex(to, isBlack);

        if (!Array.isArray(fromIndexes[0])) fromIndexes = [fromIndexes];
        if (!Array.isArray(toIndexes[0])) toIndexes = [toIndexes];

        if (fromIndexes.length === 2) {
            const [[kingRow, kingCol], [kingNewRow, kingNewCol]] = fromIndexes;

            const king = board[kingRow][kingCol];
            board[kingRow][kingCol] = null;
            board[kingNewRow][kingNewCol] = king;
            preMovesBoard[kingRow][kingCol] = null;
            preMovesBoard[kingNewRow][kingNewCol] = king;

            // Determine row of the king
            const row = kingRow; // kingRow is already defined

            if (kingCol > kingNewCol) {
                // Queenside castling
                const rook = board[row][0];
                board[row][0] = null;
                preMovesBoard[row][0] = null;

                board[row][kingNewCol + 1] = rook;
                preMovesBoard[row][kingNewCol + 1] = rook;

                // Move king
                board[kingRow][kingCol] = null;
                board[kingNewRow][kingNewCol] = king;
                preMovesBoard[kingRow][kingCol] = null;
                preMovesBoard[kingNewRow][kingNewCol] = king;
            } else {
                // Kingside castling
                const rook = board[row][7];
                board[row][7] = null;
                preMovesBoard[row][7] = null;

                board[row][kingNewCol - 1] = rook;
                preMovesBoard[row][kingNewCol - 1] = rook;

                // Move king
                board[kingRow][kingCol] = null;
                board[kingNewRow][kingNewCol] = king;
                preMovesBoard[kingRow][kingCol] = null;
                preMovesBoard[kingNewRow][kingNewCol] = king;
            }


            if (king) {
                console.log(kingNewCol === 1 || kingNewCol === 6)
                console.log(kingNewCol === 2 || kingNewCol === 5)
                setMovesHistory(prev =>
                    [...prev, getNotation(kingNewRow, kingNewCol, !isBlack, king, false, kingNewCol === 1 || kingNewCol === 6, kingNewCol === 2 || kingNewCol === 5)]
                );
            }

        } else {
            const [[row, col]] = fromIndexes;
            const [[newRow, newCol]] = toIndexes;
            const piece = board[row][col];
            let isCapture = !!board[newRow][newCol];

            if (piece.name[1] === 'p' && col !== newCol && board[newRow][newCol] == null) {
                isCapture = true;
                const epRow = isBlack ? newRow + 1 : newRow - 1;
                board[epRow][newCol] = null;
                preMovesBoard[epRow][newCol] = null;
            }

            if (piece.name[1] === 'p' && (newRow === 0 || newRow === 7)) {
                const queen = piece.name[0] + "q";
                board[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
            } else {
                board[newRow][newCol] = piece;
            }

            board[row][col] = null;
            preMovesBoard[newRow][newCol] = board[newRow][newCol];
            preMovesBoard[row][col] = null;
            handleCheckMate(board[newRow][newCol]);

            let notaionPiece = board[newRow][newCol]
            if (notaionPiece) {
                setMovesHistory(prev =>
                    [...prev, getNotation(newRow, newCol, !isBlack, piece, isCapture, false, false)]
                );
            }
        }

        setPreviousMove([]);
        // handleDraw();
        setTurn(!turn);

    }, [opponentMove]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (turn) {
                setWhiteTime((prev) => Math.max(prev - 1, 0));
            } else {
                setBlackTime((prev) => Math.max(prev - 1, 0));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [turn]);

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [movesHistory]);

    useEffect(() => {
        localStorage.setItem("boardPosition", JSON.stringify(boardPosition));
    }, [boardPosition]);

    const rows = 8;
    const cols = 8;
    const cellSize = size / 8;
    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const lightBlue = "#2E90F2"
    const darkBlue = "#073B6E"
    const checkMateColor = "#880808";
    const drawColor = "#3238ad"
    const lightGreen = "#008000"
    const darkGreen = "#0F4D0F"
    const lightBoysenberry = "#873260"
    const darkBoysenberry = "#6C284D"
    const imageScale = 0.75;

    const [preMovesBoard, setPreMovesBoard] = useState(structuredClone(board)); // preMovesBoard should not be identically as board.

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
                    let color = (row + col) % 2 === 0 ? lightColor : darkColor
                    let piece = board[row][col]
                    if (previousMove.length > 0) {
                        let [from, to] = previousMove
                        if ((row === from[0] && col === from[1]) || (row === to[0] && col === to[1])) {
                            color = (row + col) % 2 === 0 ? lightBoysenberry : darkBoysenberry
                        }
                    }
                    if (boardCol[row][col]) {
                        color = (row + col) % 2 === 0 ? lightBlue : darkBlue
                    }
                    if (highlightBoard[row][col]) {
                        color = (row + col) % 2 === 0 ? lightGreen : darkGreen
                    }
                    if (isCheckMate) {
                        let king = "bk"
                        if (winner === 'black') {
                            king = "wk"
                        }
                        if (piece !== null && piece.name === king) {
                            color = checkMateColor;
                        }
                    }
                    if (isDraw) {
                        if (piece != null && ["wk", "bk"].includes(piece.name)) {
                            color = drawColor
                        }
                    }
                    ctx.fillStyle = color;
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
                    const piece = preMovesBoard[row][col];
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
            lines.forEach(({ start, end }) => drawArrow(ctx, start, end, "orange", cellSize / 4, cellSize));

            if (isRightDragging && startPos && mousePos) {
                drawArrow(ctx, startPos, mousePos, "orange", cellSize / 4, cellSize);
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
        [
            cellSize,
            size,
            images,
            draggingPiece,
            mousePos,
            moves,
            isBlack,
            isCheckMate,
            winner,
            isDraw,
            startPos,
            isRightDragging,
            lines,
            preMovesBoard,
            boardCol,
            previousMove
        ]
    );

    function drawArrow(ctx, start, end, color = "red", lineWidth = 20, cellSize = 75) {
        if (isCheckMate) return
        const sx = Math.floor(start.x / cellSize) * cellSize + cellSize / 2;
        const sy = Math.floor(start.y / cellSize) * cellSize + cellSize / 2;
        const ex = Math.floor(end.x / cellSize) * cellSize + cellSize / 2;
        const ey = Math.floor(end.y / cellSize) * cellSize + cellSize / 2;

        if (sx === ex && sy === ey) return

        const dx = ex - sx;
        const dy = ey - sy;
        const angle = Math.atan2(dy, dx);

        const headLength = lineWidth * 2;
        const headWidth = lineWidth * 2;

        const lineEndX = ex - headLength * Math.cos(angle);
        const lineEndY = ey - headLength * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "butt";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
            ex - headLength * Math.cos(angle) + headWidth * Math.sin(angle) / 2,
            ey - headLength * Math.sin(angle) - headWidth * Math.cos(angle) / 2
        );
        ctx.lineTo(
            ex - headLength * Math.cos(angle) - headWidth * Math.sin(angle) / 2,
            ey - headLength * Math.sin(angle) + headWidth * Math.cos(angle) / 2
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    const getPieceMoves = useCallback((row, col, piece, board) => {
        let newMoves = []
        if (board[row][col] == null || board[row][col].name !== piece.name) {
            return newMoves
        }
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
                    newMoves = getWPawnMoves(row, col, board);
                } else {
                    newMoves = getBPawnMoves(row, col, board);
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
                    newMoves = getWPawnMoves(row, col, board);
                } else {
                    newMoves = getBPawnMoves(row, col, board);
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
        return newMoves
    }, [
        getKingMoves, getKingThreatMoves, getPinMoves
    ])

    const getPiecePreMoves = useCallback((row, col, piece) => {
        let newMoves = []
        switch (piece.name) {
            case "wp":
                if (piece.isPlayable) {
                    newMoves = getWPawnPreMoves(row, col);
                } else {
                    newMoves = getBPawnPreMoves(row, col);
                }
                break;
            case "bp":
                if (piece.isPlayable) {
                    newMoves = getWPawnPreMoves(row, col);
                } else {
                    newMoves = getBPawnPreMoves(row, col);
                }
                break;
            case "bn":
                newMoves = getKnightPreMoves(row, col);
                break;
            case "wn":
                newMoves = getKnightPreMoves(row, col);
                break;
            case "bk":
                newMoves = getKingPreMoves(row, col, preMovesBoard);
                break;
            case "wk":
                newMoves = getKingPreMoves(row, col, preMovesBoard);
                break;
            case "br":
                newMoves = getVerticalPreMoves(row, col)
                    .concat(getHorizontalPreMoves(row, col))
                break;
            case "wr":
                newMoves = getVerticalPreMoves(row, col)
                    .concat(getHorizontalPreMoves(row, col));
                break;
            case "bb":
                newMoves = getMainDiagonalPreMoves(row, col)
                    .concat(getAntiDiagonalPreMoves(row, col));
                break;
            case "wb":
                newMoves = getMainDiagonalPreMoves(row, col)
                    .concat(getAntiDiagonalPreMoves(row, col));
                break;
            case "wq":
                newMoves = getMainDiagonalPreMoves(row, col)
                    .concat(getAntiDiagonalPreMoves(row, col))
                    .concat(getVerticalPreMoves(row, col))
                    .concat(getHorizontalPreMoves(row, col));
                break;
            case "bq":
                newMoves = getMainDiagonalPreMoves(row, col)
                    .concat(getAntiDiagonalPreMoves(row, col))
                    .concat(getVerticalPreMoves(row, col))
                    .concat(getHorizontalPreMoves(row, col));
                break;
            default:
                console.log("Invalid piece name");
        }
        return newMoves
    }, [])

    const play = useCallback((row, col, newRow, newCol, currentPiece) => {
        let isCapture = false
        let isValid = false
        if (moves.some(([r, c]) => r === newRow && c === newCol)) {
            isValid = true
            let piece = board[newRow][newCol]
            if (piece != null && currentPiece.name[0] !== piece.name[0]) isCapture = true
            if (newCol !== col || newRow !== row) {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (board[row][col] !== null) {
                            board[row][col].isEnpassant = false;
                        }
                    }
                }
            }
            board[row][col] = null;
            preMovesBoard[row][col] = null;
            currentPiece.isMoved = true;
            let isCastle = false, isLongCastle = false
            if (currentPiece.name[1] === 'k') {
                let dc = newCol - col;
                if (Math.abs(dc) === 2) {
                    if (dc > 0) {
                        if (isBlack) {
                            isCastle = true
                        } else {
                            isLongCastle = true
                        }
                        let tempBoard = board[row][7];
                        board[row][7] = board[row][newCol - 1];
                        board[row][newCol - 1] = tempBoard;
                        let tempPreMoves = preMovesBoard[row][7];
                        if (!boardCol[row][7]) {
                            preMovesBoard[row][7] = preMovesBoard[row][newCol - 1];
                        }
                        if (!boardCol[row][newCol - 1]) {
                            preMovesBoard[row][newCol - 1] = tempPreMoves;
                        }
                        board[row][newCol - 1].isMoved = true
                    } else {
                        if (isBlack) {
                            isLongCastle = true
                        } else {
                            isCastle = true
                        }
                        let tempBoard3 = board[row][0];
                        board[row][0] = board[row][newCol + 1];
                        board[row][newCol + 1] = tempBoard3;
                        let tempPreMoves3 = preMovesBoard[row][0];
                        if (!boardCol[row][0]) {
                            preMovesBoard[row][0] = preMovesBoard[row][newCol + 1];
                        }
                        if (!boardCol[row][newCol + 1]) {
                            preMovesBoard[row][newCol + 1] = tempPreMoves3;
                        }
                        board[row][newCol + 1].isMoved = true
                    }
                }
            }

            if (currentPiece.name === "wp" || currentPiece.name === "bp") {
                if (col !== newCol) {
                    if (board[newRow][newCol] === null) {
                        board[row][newCol] = null
                        preMovesBoard[row][newCol] = null
                        isCapture = true
                    }
                }
                if (Math.abs(row - newRow) === 2) {
                    currentPiece.isEnpassant = true
                }
            }
            let queen = currentPiece.name[0] + "q"
            if (newRow === 7 && !currentPiece.isPlayable && currentPiece.name[1] === 'p') {
                board[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                if (!boardCol[newRow][newCol]) {
                    preMovesBoard[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                }
            } else if (newRow === 0 && currentPiece.isPlayable && currentPiece.name[1] === 'p') {
                board[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                if (!boardCol[newRow][newCol]) {
                    preMovesBoard[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                }
            } else {
                board[newRow][newCol] = currentPiece;
                if (!boardCol[newRow][newCol]) {
                    preMovesBoard[newRow][newCol] = currentPiece;
                }
            }
            handleCheckMate(currentPiece)

            setTurn(!turn)
            if (currentPiece) {
                let oldPos = getNotation(row, col, !isBlack, currentPiece, isCapture, isCastle, isLongCastle)
                let newPos = getNotation(newRow, newCol, !isBlack, currentPiece, isCapture, isCastle, isLongCastle)
                sendMessage({
                    "game_id": gameId,
                    "type": "move",
                    "data": {
                        "from": oldPos,
                        "to": newPos,
                    }
                })
                setMovesHistory(prev => [...prev, newPos]);
            }

            // handleDraw()
            setPreviousMove([[row, col], [newRow, newCol]])
            setCurrentPiece(null)
            setMoves([]);
        }
        return isValid
    }, [
        boardPosition,
        getKingMoves,
        getKingThreatMoves,
        getNumberOfChecks,
        getPinMoves,
        isBlack,
        moves,
        preMovesBoard,
        turn
    ])

    useEffect(() => {
        if (turn && preMoves.length !== 0) {
            const [{ from, to, piece }, ...remainingPreMoves] = preMoves;
            const [row, col] = from;
            const [newRow, newCol] = to;
            let isCapture = false
            let isCastle = false, isLongCastle = false
            if (getPieceMoves(row, col, piece, board).some(([r, c]) => r === newRow && c === newCol)) {
                if (piece.name[1] === 'k' && Math.abs(newCol - col) > 1) {
                    if (newCol < col) {
                        if (isBlack) {
                            isCastle = true
                        } else {
                            isLongCastle = true
                        }
                        let rook = board[7][0]
                        board[7][0] = null
                        board[row][col] = null
                        board[7][newCol] = piece
                        board[7][newCol + 1] = rook
                        boardCol[7][newCol]--
                        boardCol[7][newCol + 1]--
                    } else {
                        if (isBlack) {
                            isLongCastle = true
                        } else {
                            isCastle = true
                        }
                        let rook = board[7][7]
                        board[7][7] = null
                        board[row][col] = null
                        board[7][newCol] = piece
                        board[7][newCol - 1] = rook
                        boardCol[7][newCol]--
                        boardCol[7][newCol - 1]--
                    }
                } else if (piece.name[1] === 'p' && newCol !== col && board[row][newCol] != null && board[row][newCol].isEnpassant) {
                    isCapture = true
                    board[row][newCol] = null
                    preMovesBoard[row][newCol] = null
                    boardCol[newRow][newCol]--
                    board[newRow][newCol] = piece
                    board[row][col] = null
                } else {
                    boardCol[newRow][newCol]--
                    if (board[newRow][newCol]) isCapture = true
                    if (piece.name[1] === 'p' && newRow === 0) {
                        let queen = piece.name[0] + "q"
                        board[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                        board[newRow][newCol].isPlayable = true
                    } else {
                        board[newRow][newCol] = piece
                    }
                    board[row][col] = null
                }
                setPreviousMove([])
                let notationPiece = board[newRow][newCol]
                if (notationPiece) {
                    setMovesHistory(prev => [...prev, getNotation(newRow, newCol, !isBlack, notationPiece, isCapture, isCastle, isLongCastle)]);
                }
                handleCheckMate(piece)
                setPreMoves(remainingPreMoves)
                // handleDraw()
                if (piece) {
                    let oldPos = getNotation(row, col, !isBlack, piece, isCapture, isCastle, isLongCastle)
                    let newPos = getNotation(newRow, newCol, !isBlack, piece, isCapture, isCastle, isLongCastle)
                    sendMessage({
                        "game_id": gameId,
                        "type": "move",
                        "data": {
                            "from": oldPos,
                            "to": newPos,
                        }
                    })
                }
                setTurn(!turn)
            } else {
                for (let row = 0; row <= 7; row++) {
                    for (let col = 0; col <= 7; col++) {
                        boardCol[row][col] = 0
                        preMovesBoard[row][col] = board[row][col]
                    }
                }
                setPreMoves([]);
            }
        }
    }, [turn]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");
        drawBoard(ctx);

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        const handleMouseMove = (e) => {
            const pos = getMousePos(e);

            if (isRightDragging) {
                setMousePos(pos);
                drawBoard(ctx);
                return;
            }
            if (draggingPiece) {
                setMousePos(pos);
                drawBoard(ctx);
            }
        };

        const handleMouseDown = (e) => {
            if (isCheckMate || isDraw) return
            const pos = getMousePos(e);
            const col = Math.floor(pos.x / cellSize);
            const row = Math.floor(pos.y / cellSize);
            const piece = preMovesBoard[row][col];
            if (e.button === 2) {
                e.preventDefault();
                setPreviousRightClickCords([row, col])
                for (let row = 0; row <= 7; row++) {
                    for (let col = 0; col <= 7; col++) {
                        preMovesBoard[row][col] = board[row][col]
                    }
                }
                setBoardCol(Array.from({ length: 16 }, () => Array(16).fill(0)));
                setPreMoves([])
                setStartPos(pos);
                setMousePos(pos);
                setIsRightDragging(true);
                return;
            } else if (e.button === 0) {
                setHighLightBoard(Array.from({ length: 16 }, () => Array(16).fill(false)));
                if (moves.some(([r, c]) => r === row && c === col)) {
                    if (currentPiece) {
                        handleMove(row, col, currentPiece)
                    }
                }
                setMoves([]);
                setLines([]);
                drawBoard(ctx);
            }
            if (piece && piece.isPlayable) {
                setDraggingPiece({ piece, row, col });
                setCurrentPiece({ piece, row, col });
                setMousePos(pos)
                let newMoves = [];
                if (piece.isPlayable === turn) {
                    newMoves = getPieceMoves(row, col, piece, board)
                } else {
                    if (!piece.isPlayable) return;
                    newMoves = getPiecePreMoves(row, col, piece)
                }
                setMoves(newMoves);
            }
        };

        const handleMouseUp = (e) => {
            const pos = getMousePos(e);
            const newCol = Math.floor(pos.x / cellSize);
            const newRow = Math.floor(pos.y / cellSize);
            if (e.button === 2) {
                if (!isDraw) setLines((prev) => [...prev, { start: startPos, end: mousePos }]);
                if (previousRightClickCords.length > 0 && previousRightClickCords[0] === newRow && previousRightClickCords[1] === newCol) {
                    highlightBoard[newRow][newCol] = true
                    setPreviousRightClickCords([])
                }
                setIsRightDragging(false);
                setStartPos(null);
                setMousePos(null);
            }
            if (!draggingPiece) return

            handleMove(newRow, newCol, draggingPiece)

            setDraggingPiece(null);
            drawBoard(ctx);
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("contextmenu", handleContextMenu);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [
        images,
        drawBoard,
        draggingPiece,
        cellSize,
        moves,
        turn,
        setTurn,
        setMovesHistory,
        isBlack,
        isCheckMate,
        setIsCheckMate,
        isDraw,
        boardPosition,
        isRightDragging,
        mousePos,
        startPos,
        preMoves,
        setPreMoves,
        preMovesBoard,
        boardCol,
        getKingMoves,
        getKingThreatMoves,
        getNumberOfChecks,
        getPieceMoves,
        getPiecePreMoves,
        getPinMoves,
        play
    ]);

    function handleDraw() {
        let fenKey = getFenFromBoard(board);

        const index = boardPosition.findIndex((item) => item.key === fenKey);

        if (index !== -1) {
            const boardPos = [...boardPosition];
            boardPos[index].value++;

            if (boardPos[index].value >= 3) {
                setBoardPosition([]);
                setIsDraw(true);
            } else {
                setBoardPosition(boardPos);
            }

        } else {
            setBoardPosition([...boardPosition, { key: fenKey, value: 1 }]);
        }
    }

    function handleCheckMate(piece) {
        if (!piece) return
        let targetCol = piece.name[0]
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
                    if (antiTarget === 'b') {
                        setWinner("black")
                    } else {
                        setWinner("white")
                    }
                    setBoardPosition([]);
                    setIsCheckMate(true)
                }
            }
        }
        let queen = targetCol + 'q'
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
                                ? getWPawnMoves(row, col, board)
                                : getBPawnMoves(row, col, board);
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
                if (antiTarget === 'b') {
                    setWinner("black")
                } else {
                    setWinner("white")
                }
                setBoardPosition([]);
                setIsCheckMate(true)
            } else {
                setBoardPosition([]);
                setIsDraw(true)
            }
        }
    }

    function handleMove(newRow, newCol, piece) {
        if (piece.piece.isPlayable !== turn) {
            if (moves.some(([r, c]) => r === newRow && c === newCol)) {
                let currentPiece = structuredClone(preMovesBoard[piece.row][piece.col]);
                currentPiece.isMoved = true
                setPreMoves([...preMoves, {
                    from: [piece.row, piece.col],
                    to: [newRow, newCol],
                    piece: currentPiece
                }]);
                if (currentPiece.name[1] === 'k' && Math.abs(newCol - piece.col) > 1) {
                    if (newCol < piece.col) {
                        let rook = board[7][0]
                        preMovesBoard[7][0] = null
                        preMovesBoard[piece.row][piece.col] = null
                        preMovesBoard[7][newCol] = currentPiece
                        preMovesBoard[7][newCol + 1] = rook
                        boardCol[7][newCol]++
                        boardCol[7][newCol + 1]++
                    } else {
                        let rook = board[7][7]
                        preMovesBoard[7][7] = null
                        preMovesBoard[piece.row][piece.col] = null
                        preMovesBoard[7][newCol] = currentPiece
                        preMovesBoard[7][newCol - 1] = rook
                        boardCol[7][newCol]++
                        boardCol[7][newCol - 1]++
                    }
                } else {
                    preMovesBoard[piece.row][piece.col] = null
                    boardCol[newRow][newCol]++
                    if (currentPiece.name[1] === 'p' && newRow === 0) {
                        let queen = currentPiece.name[0] + "q"
                        preMovesBoard[newRow][newCol] = new Piece(queen, pieceImages[queen], 9);
                        preMovesBoard[newRow][newCol].isPlayable = true
                    } else {
                        preMovesBoard[newRow][newCol] = currentPiece
                    }
                }
                setMoves([]);
            }
        } else {
            play(piece.row, piece.col, newRow, newCol, piece.piece)
        }
    }

    return (
        <div className="flex items-center justify-center bg-gray-900 mt-8">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded-lg shadow-lg cursor-pointer"
            />
            <div className="flex flex-col">
                {(() => {
                    if (winner) {
                        return (
                            <div className="text-white p-4">
                                {winner === "white" ? "White won!" : "Black won!"}
                            </div>
                        );
                    }
                    if (isDraw) {
                        return <div className="text-white p-4">Draw!</div>;
                    }
                })()}
                <div className="p-4">
                    <div className="flex justify-between items-center text-white text-xl">
                        <div className="flex flex-col">
                            <span>Ahmed Milad</span>
                            <span className="text-sm text-gray-400">1000</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={!turn ? "text-green-400 font-mono" : "text-gray-400 font-mono"}>
                                {formatTime(blackTime)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-96 mx-4 bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden">
                    <div className="bg-gray-700 text-white p-2 text-center font-semibold">
                        Moves
                    </div>

                    <div ref={scrollRef} className="h-72 overflow-y-auto">
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
                <div className="p-4">
                    <div className="flex justify-between items-center text-white text-xl">
                        <div className="flex flex-col">
                            <span>Ahmed Milad</span>
                            <span className="text-sm text-gray-400">1000</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={turn ? "text-green-400 font-mono" : "text-gray-400 font-mono"}>
                                {formatTime(whiteTime)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
