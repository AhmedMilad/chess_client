import { useState, useEffect, useRef } from "react";
import {
    pieceImages,
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
    fenToAnalysisBoard,
    coordinatesToNotation,
    getFenFromBoard,
    rotateMatrix180,
    notationToIndex
} from "../utils/game"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";

export default function AnalysisBoard() {

    const rows = 8;
    const cols = 8;
    const size = 750;

    const cellSize = size / 8;
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const [board, setBoard] = useState([]);
    const [images, setImages] = useState({});

    const [startPos, setStartPos] = useState(null);
    const [turn, setTurn] = useState("white");
    const imageScale = 0.75;
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [isRightDragging, setIsRightDragging] = useState(false);

    const [moves, setMoves] = useState([]);
    const [enpassantSquare, setEnpassantSquare] = useState(null);
    const [lines, setLines] = useState([]);

    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const [canWhiteKingSideCastle, setCanWhiteKingSideCastle] = useState(true)
    const [canWhiteLongCastle, setCanWhiteLongCastle] = useState(true)

    const [canBlackKingSideCastle, setCanBlackKingSideCastle] = useState(true)
    const [canBlackLongCastle, setCanBlackLongCastle] = useState(true)

    const [isOriginalPerspective, setIsOriginalPerspective] = useState(true)
    const [isMateFound, setIsMateFound] = useState(false)
    const [stepsToMate, setStepsToMate] = useState(0)

    const [isEngineReady, setIsEngineReady] = useState(false);
    const [worker, setWorker] = useState(null)

    useEffect(() => {
        setWorker(new Worker("/stockfish.js"))
    }, [])


    useEffect(() => {

        if (worker === null) {
            return
        }

        worker.onmessage = (e) => {
            const line = e.data;

            let mateLines = line.split(" mate ");

            if (mateLines.length > 1) {

                mateLines = mateLines[1].split(" ")

                if (mateLines.length > 0) {
                    setStepsToMate(parseInt(mateLines[0]))
                }

                if (turn === "white") {
                    setBoardEvaluation(10)
                } else {
                    setBoardEvaluation(-10)

                }

                setIsMateFound(true)

            } else {

                let cpLines = line.split(" cp ");

                if (cpLines.length > 1) {
                    let targettedCpLine = cpLines[1]
                    targettedCpLine = targettedCpLine.split(" ");

                    if (targettedCpLine.length > 0) {

                        let evaluation = parseFloat(targettedCpLine[0]) / 100
                        setBoardEvaluation((turn === 'white') ? evaluation : evaluation * -1)

                    }
                }
            }


            let lines = line.split(" pv ");

            if (lines.length > 0) {
                let moveLines = lines[1]

                if (moveLines) {
                    moveLines = moveLines.split(" ");
                    if (moveLines.length > 0) {

                        const from = moveLines[0].slice(0, 2);
                        const to = moveLines[0].slice(-2);

                        let fromIndex = notationToIndex(from, !isOriginalPerspective)
                        let toIndex = notationToIndex(to, !isOriginalPerspective)

                        let cellSize = 93.75 //TODO fix this

                        setLines([
                            {
                                start: { x: fromIndex[1] * cellSize + cellSize / 2, y: fromIndex[0] * cellSize + cellSize / 2 },
                                end: { x: toIndex[1] * cellSize + cellSize / 2, y: toIndex[0] * cellSize + cellSize / 2 }
                            },
                        ])
                    }

                }

            }

            if (line === "readyok") {
                setIsEngineReady(true)
            }
        };

        worker.postMessage("uci");
        worker.postMessage("isready");
    }, [
        worker,
        turn
    ])


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

        let brd = fenToAnalysisBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");

        if (!isOriginalPerspective) {
            brd = rotateMatrix180(brd)

        }

        setBoard(brd)

    }, [isOriginalPerspective]);

    // mock moves
    const evaluationHistory = [
        { moveStr: "Start", displayScore: 0.0 },
        { moveStr: "e4", displayScore: 0.3 },
        { moveStr: "e5", displayScore: 0.1 },
        { moveStr: "Nf3", displayScore: 0.4 },
        { moveStr: "Nc6", displayScore: -0.2 },
        { moveStr: "Bc4", displayScore: 0.5 },
        { moveStr: "Nf6", displayScore: -1.5 }, // Black is better
        { moveStr: "Ng5", displayScore: 1.2 },  // White takes advantage
        { moveStr: "d5", displayScore: 0.8 },
        { moveStr: "exd5", displayScore: 2.1 }, // White is winning significantly
    ];

    const scores = evaluationHistory?.map(d => d.displayScore) || [0];
    const maxVal = Math.max(...scores, 0);
    const minVal = Math.min(...scores, 0);

    function onMoveClick(e) {
        console.log(e)
    }

    const getBarHeight = (score) => {
        let minScore = -10;
        let maxScore = 10;

        if (!isOriginalPerspective) {
            minScore = 10
            maxScore = -10
        }

        const percentage = ((score - minScore) / (maxScore - minScore)) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [boardEvaluation, setBoardEvaluation] = useState(evaluationHistory[0].displayScore);
    const [whiteHeight, setWhiteHeight] = useState(getBarHeight(boardEvaluation));

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
        };
    }, [images, draggingPiece, moves]);

    function drawArrow(ctx, start, end, color = "red", lineWidth = 20, cellSize = 75) {
        if (start === undefined || end === undefined) return;

        const sx = Math.floor(start.x / cellSize) * cellSize + cellSize / 2;
        const sy = Math.floor(start.y / cellSize) * cellSize + cellSize / 2;
        const ex = Math.floor(end.x / cellSize) * cellSize + cellSize / 2;
        const ey = Math.floor(end.y / cellSize) * cellSize + cellSize / 2;

        if (sx === ex && sy === ey) return;

        const dx = ex - sx;
        const dy = ey - sy;
        const angle = Math.atan2(dy, dx);

        const headLength = lineWidth * 2;
        const headWidth = lineWidth * 2;

        const lineEndX = ex - headLength * Math.cos(angle);
        const lineEndY = ey - headLength * Math.sin(angle);

        ctx.save();
        ctx.globalAlpha = 0.75;

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

        ctx.restore();
    }

    // draw board
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, size, size);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let color = (row + col) % 2 === 0 ? lightColor : darkColor

                ctx.fillStyle = color;
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }

        ctx.fillStyle = "#000";
        ctx.font = `${cellSize / 5}px Arial`;
        ctx.textBaseline = "top";

        if (isOriginalPerspective) {
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
                if (board.length === 0) {
                    continue
                }

                const piece = board[row][col];

                if (piece && images[piece.name]) {
                    if (draggingPiece && draggingPiece.row === row && draggingPiece.col === col) {

                        continue;
                    }

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
            drawArrow(ctx, startPos, mousePos, "blue", cellSize / 4, cellSize);
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
    }, [
        board,
        images,
        mousePos,
        moves,
        draggingPiece,
        lines
    ])

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const getPieceMoves = (row, col, piece, board) => {
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

                if (isOriginalPerspective) {
                    newMoves = getWPawnMoves(row, col, board, enpassantSquare);

                } else {
                    newMoves = getBPawnMoves(row, col, board, enpassantSquare);
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

                if (isOriginalPerspective) {

                    newMoves = getBPawnMoves(row, col, board, enpassantSquare);
                } else {
                    newMoves = getWPawnMoves(row, col, board, enpassantSquare);
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
                if (isOriginalPerspective) {
                    newMoves = getKingMoves(row, col, board, "w", canBlackLongCastle, canBlackKingSideCastle);
                } else {
                    newMoves = getKingMoves(row, col, board, "w", canBlackKingSideCastle, canBlackLongCastle);
                }
                break;
            case "wk":
                if (isOriginalPerspective) {
                    newMoves = getKingMoves(row, col, board, "b", canWhiteKingSideCastle, canWhiteLongCastle);
                } else {
                    newMoves = getKingMoves(row, col, board, "b", canWhiteLongCastle, canWhiteKingSideCastle);

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
    }


    const handleMouseDown = (e) => {

        const pos = getMousePos(e);
        const col = Math.floor(pos.x / cellSize);
        const row = Math.floor(pos.y / cellSize);
        const piece = board[row][col];

        if (e.button === 2) {
            e.preventDefault();
            setStartPos(pos);
            setMousePos(pos);
            setIsRightDragging(true);
            return;
        } else if (e.button === 0) {
            if (piece && piece.isPlayable) {

                setDraggingPiece({ piece, row, col });
                setMousePos(pos)

                if ((turn === "white" && piece?.name[0] === 'w') || (turn === "black" && piece?.name[0] === 'b')) {
                    setMoves(getPieceMoves(row, col, piece, board));

                }

            } else {
                setMoves([])

            }
        }

    };

    const handleMouseMove = (e) => {

        const pos = getMousePos(e);
        setMousePos(pos);
    };

    const handleMouseUp = (e) => {

        const pos = getMousePos(e);

        const newCol = Math.floor(pos.x / cellSize);
        const newRow = Math.floor(pos.y / cellSize);

        if (e.button === 2) {
            setIsRightDragging(false);
            setStartPos(null);
            setMousePos(null);
        }

        if (!draggingPiece) return

        handleMove(newRow, newCol, draggingPiece)

        setDraggingPiece(null)

    };

    function swapBoardPieces(oldRow, oldCol, newRow, newCol, board) {
        let tmp = board[oldRow][oldCol]
        board[oldRow][oldCol] = board[newRow][newCol]
        board[newRow][newCol] = tmp

        return board

    }

    function handleMove(newRow, newCol, piece) {

        // valid move
        if (moves.some(([r, c]) => r === newRow && c === newCol)) {

            const isCapture = (board[newRow][newCol] != null)
            const curPiece = piece?.piece

            setBoard(prev => {
                let newBoard = structuredClone(prev);

                newBoard[piece.row][piece.col] = null;
                newBoard[newRow][newCol] = piece?.piece;


                if (curPiece?.name[1] === "k") {
                    // castle move
                    if (Math.abs(newCol - piece?.col) === 2) {
                        let brd = newBoard

                        if (newCol > piece?.col) {

                            newBoard = swapBoardPieces(newRow, 7, newRow, newCol - 1, brd)
                        } else {

                            newBoard = swapBoardPieces(newRow, 0, newRow, newCol + 1, brd)
                        }

                    }

                }

                if (curPiece.name[1] === "p") {
                    // enpassant capture
                    if (newCol !== piece.col && !isCapture) {

                        if (isOriginalPerspective) {

                            if (turn === "white") {

                                newBoard[newRow + 1][newCol] = null;


                            } else {

                                newBoard[newRow - 1][newCol] = null;

                            }

                        } else {

                            if (turn === "white") {

                                newBoard[newRow - 1][newCol] = null;

                            } else {

                                newBoard[newRow + 1][newCol] = null;

                            }
                        }

                    }
                }

                return newBoard;
            });

            if (curPiece?.name[1] === "r") {
                if (turn === "white") { // targetted piece is white

                    if (isOriginalPerspective) {

                        if (piece?.col === 0) {
                            setCanWhiteLongCastle(false)
                        }

                        if (piece?.col === 7) {
                            setCanWhiteKingSideCastle(false)
                        }

                    } else {
                        if (piece?.col === 0) {
                            setCanWhiteKingSideCastle(false)

                        }

                        if (piece?.col === 7) {
                            setCanWhiteLongCastle(false)

                        }
                    }


                } else {
                    // targetted piece is black

                    if (isOriginalPerspective) {

                        if (piece?.col === 0) {
                            setCanBlackLongCastle(false)
                        }

                        if (piece?.col === 7) {
                            setCanBlackKingSideCastle(false)
                        }

                    } else {
                        if (piece?.col === 0) {
                            setCanBlackKingSideCastle(false)

                        }

                        if (piece?.col === 7) {
                            setCanBlackLongCastle(false)

                        }
                    }

                }
            }

            if (curPiece.name[1] === "p") {

                if (Math.abs(newRow - piece.row) === 2) {

                    if (isOriginalPerspective) {

                        if (turn === "white") {
                            // might need a validation here
                            setEnpassantSquare(coordinatesToNotation(newRow, newCol, !isOriginalPerspective))
                        } else {
                            setEnpassantSquare(coordinatesToNotation(newRow, newCol, !isOriginalPerspective))
                        }

                    } else {

                        if (turn === "white") {
                            setEnpassantSquare(coordinatesToNotation(newRow, newCol, !isOriginalPerspective))
                        } else {
                            setEnpassantSquare(coordinatesToNotation(newRow, newCol, !isOriginalPerspective))
                        }

                    }

                } else {
                    setEnpassantSquare(null)
                }

            } else {
                setEnpassantSquare(null)

            }

            setTurn((turn === "white") ? "black" : "white")
            setMoves([])
            setLines([]);

        }
    }


    useEffect(() => {

        if (worker !== null && isEngineReady && turn && board?.length > 0) {

            const turnCol = turn[0]
            const boardFen = getFenFromBoard(board, turnCol, isOriginalPerspective)

            // send the fen notation to the engine

            if (isEngineReady) {
                worker.postMessage(`position fen ${boardFen} ${turnCol} KQkq - 0 1`);
                worker.postMessage("go depth 15x");
            }

        }
    }, [
        board,
        turn,
        worker,
        isOriginalPerspective,
        isEngineReady
    ])

    useEffect(() => {
        setWhiteHeight(getBarHeight(boardEvaluation))
    }, [
        boardEvaluation
    ])


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-6">
            <div className="flex flex-row w-full max-w-6xl gap-6 items-stretch">

                <div className="flex flex-col flex-1 gap-4">

                    <div className="flex flex-row items-center justify-center gap-4 w-full">

                        {(
                            () => {

                                if (isOriginalPerspective) {
                                    return (
                                        <div
                                            className="relative w-6 rounded flex flex-col overflow-hidden bg-black border border-neutral-700 shadow-inner"
                                            style={{ height: `${size}px` }}
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-white transition-all duration-200 ease-in-out"
                                                style={{ height: `${whiteHeight}%` }}
                                            />

                                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-500 opacity-50 pointer-events-none" />

                                            <div className="absolute inset-x-0 bottom-2 text-center font-sans font-bold text-[11px] pointer-events-none z-10 mix-blend-difference text-white">

                                                {(() => {
                                                    if (isMateFound) {
                                                        return `m${stepsToMate}`
                                                    } else {
                                                        return boardEvaluation > 0 ? `+${boardEvaluation.toFixed(1)}` : boardEvaluation.toFixed(1)
                                                    }
                                                })()}

                                            </div>
                                        </div>
                                    )

                                } else {
                                    return (
                                        <div
                                            className="relative w-6 rounded flex flex-col overflow-hidden bg-white border border-neutral-700 shadow-inner"
                                            style={{ height: `${size}px` }}
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-black transition-all duration-200 ease-in-out"
                                                style={{ height: `${whiteHeight}%` }}
                                            />

                                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-500 opacity-50 pointer-events-none" />

                                            <div className="absolute inset-x-0 bottom-2 text-center font-sans font-bold text-[11px] pointer-events-none z-10 mix-blend-difference text-white">

                                                {(() => {
                                                    if (isMateFound) {
                                                        return `m${stepsToMate}`
                                                    } else {
                                                        return boardEvaluation > 0 ? `+${boardEvaluation.toFixed(1)}` : boardEvaluation.toFixed(1)
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    )
                                }

                            }
                        )()}


                        <canvas
                            ref={canvasRef}
                            width={size}
                            height={size}
                            className="rounded-lg shadow-lg cursor-pointer bg-neutral-800"
                        />
                    </div>

                    <div style={{ width: '100%', height: '200px', backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px' }}>
                        <h3 style={{ color: '#fff', margin: '0 0 10px 0', fontFamily: 'sans-serif', fontSize: '14px' }}>
                            Game Evaluation
                        </h3>

                        <style>{`
                            .no-outline-chart :focus, 
                            .no-outline-chart g:focus, 
                            .no-outline-chart path:focus,
                            .no-outline-chart .recharts-wrapper :focus {
                                outline: none !important;
                                box-shadow: none !important;
                            }
                        `}</style>

                        <ResponsiveContainer width="100%" height="90%" className="no-outline-chart">
                            <AreaChart
                                data={evaluationHistory}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                style={{ outline: 'none' }}
                                onClick={(nextState) => {
                                    onMoveClick(nextState?.activeLabel);
                                }}
                            >
                                <defs>
                                    <linearGradient id="lichessSplit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={`${(maxVal !== minVal) ? (maxVal / (maxVal - minVal)) * 100 : 50}%`} stopColor="#ffffff" stopOpacity={1} />
                                        <stop offset={`${(maxVal !== minVal) ? (maxVal / (maxVal - minVal)) * 100 : 50}%`} stopColor="#000000" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="moveStr" stroke="#777" tick={{ fill: '#bbb', fontSize: 12 }} />
                                <YAxis
                                    domain={[-5, 5]}
                                    stroke="#777"
                                    tick={{ fill: '#bbb', fontSize: 12 }}
                                    tickFormatter={(value) => (value > 0 ? `+${value}` : value)}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}
                                    labelStyle={{ color: '#fff' }}
                                    itemStyle={{ color: '#8884d8' }}
                                    formatter={(value, name, props) => [`Score: ${props.payload.displayScore}`, 'Evaluation']}
                                />
                                <ReferenceLine y={0} stroke="#555" strokeDasharray="3 3" />
                                <Area
                                    dataKey="displayScore"
                                    stroke="#777"
                                    fill="url(#lichessSplit)"
                                    strokeWidth={2}
                                    baseValue={0}
                                    activeDot={{ r: 6, style: { outline: 'none' } }}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="w-80 bg-[#1e1e1e] rounded-lg p-4 flex flex-col shadow-xl border border-neutral-800">
                    <h3 className="text-white font-sans font-semibold mb-3 border-b border-neutral-800 pb-2 text-sm uppercase tracking-wider text-neutral-400">
                        Move Log & Centipawns
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-1 max-h-[600px] custom-scrollbar">
                        {evaluationHistory.map((move, index) => {
                            let cpChange = 0;
                            if (index > 0) {
                                const currentCp = Math.round(move.displayScore * 100);
                                const prevCp = Math.round(evaluationHistory[index - 1].displayScore * 100);
                                cpChange = currentCp - prevCp;
                            }

                            const isPositive = cpChange > 0;
                            const isZero = cpChange === 0;

                            return (
                                <div
                                    key={index}
                                    onClick={() => onMoveClick(move.moveStr)}
                                    className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer group ${index === currentMoveIndex ? 'bg-neutral-700/60' : 'bg-neutral-800/40 hover:bg-neutral-800'
                                        }`}
                                >
                                    <span className="text-neutral-300 font-mono text-sm group-hover:text-white">
                                        {index === 0 ? "Start" : `${Math.ceil(index / 2)}.${index % 2 !== 0 ? '' : '...'} ${move.moveStr}`}
                                    </span>

                                    {index > 0 ? (
                                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isZero
                                            ? 'text-neutral-500 bg-neutral-800'
                                            : isPositive
                                                ? 'text-green-400 bg-green-950/40'
                                                : 'text-red-400 bg-red-950/40'
                                            }`}>
                                            {isZero ? '±0' : `${isPositive ? '+' : ''}${cpChange}`} cp
                                        </span>
                                    ) : (
                                        <span className="text-xs text-neutral-600 font-mono">—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
