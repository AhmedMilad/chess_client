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
    rotateMatrix180
} from "../utils/game"

export default function AnalysisBoard() {

    const rows = 8;
    const cols = 8;
    const size = 750;

    const cellSize = size / 8;
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const [board, setBoard] = useState([]);
    const [isBlack, setIsBlack] = useState(false)
    const [images, setImages] = useState({});

    const [startPos, setStartPos] = useState(null);
    const [turn, setTurn] = useState("white");
    const imageScale = 0.75;
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [isRightDragging, setIsRightDragging] = useState(false);

    const [currentPiece, setCurrentPiece] = useState(null);
    const [moves, setMoves] = useState([]);
    const [enpassantSquare, setEnpassantSquare] = useState(null);
    const [lines, setLines] = useState([]);

    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const [canKingSideCastle, setCanKingSideCastle] = useState(false)
    const [canLongCastle, setCanLongCastle] = useState(false)

    const [isWhiteKingMoved, setIsWhiteKingMoved] = useState(false)
    const [isBlackKingMoved, setIsBlackKingMoved] = useState(false)
    const [isWhiteKingSideRookMoved, setIsWhiteKingSideRookMoved] = useState(false)
    const [isWhiteQueenSideRookMoved, setIsWhiteQueenKingSideRookMoved] = useState(false)
    const [isBlackKingSideRookMoved, setIsBlackKingSideRookMoved] = useState(false)
    const [isBlackQueenSideRookMoved, setIsBlackQueenKingSideRookMoved] = useState(false)

    const [isOriginalPerspective, setIsOriginalPerspective] = useState(true)

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

        // brd = rotateMatrix180(brd)

        setBoard(brd)

    }, []);

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
        lines.forEach(({ start, end }) => drawArrow(ctx, start, end, "blue", cellSize / 4, cellSize));

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
        draggingPiece
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
                newMoves = getKingMoves(row, col, board, "w", canKingSideCastle, canLongCastle);
                break;
            case "wk":
                newMoves = getKingMoves(row, col, board, "b", canKingSideCastle, canLongCastle);
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
            setLines([]);
            if (piece && piece.isPlayable) {

                setDraggingPiece({ piece, row, col });
                setCurrentPiece({ piece, row, col });
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

    function handleMove(newRow, newCol, piece) {
        if (moves.some(([r, c]) => r === newRow && c === newCol)) {
            setBoard(prev => {
                const newBoard = structuredClone(prev);

                newBoard[piece.row][piece.col] = null;
                newBoard[newRow][newCol] = piece?.piece;
                return newBoard;
            });

            const curPiece = piece?.piece

            if (curPiece?.name[1] === "k") {
                if (turn === "white") {
                    setIsWhiteKingMoved(true)
                } else {
                    setIsBlackKingMoved(true)
                }
            }

            if (curPiece?.name[1] === "r") {
                if (turn === "white") { // targetted piece is white

                    if (isOriginalPerspective) {

                        if (piece?.col === 0) {
                            setIsWhiteQueenKingSideRookMoved(true)
                        }

                        if (piece?.col === 7) {
                            setIsWhiteKingSideRookMoved(true)
                        }

                    } else {
                        if (piece?.col === 0) {
                            setIsWhiteKingSideRookMoved(true)

                        }

                        if (piece?.col === 7) {
                            setIsWhiteQueenKingSideRookMoved(true)

                        }
                    }


                } else {
                    // targetted piece is black

                    if (isOriginalPerspective) {

                        if (piece?.col === 0) {
                            setIsBlackQueenKingSideRookMoved(true)
                        }

                        if (piece?.col === 7) {
                            setIsBlackKingSideRookMoved(true)
                        }

                    } else {
                        if (piece?.col === 0) {
                            setIsBlackKingSideRookMoved(true)

                        }

                        if (piece?.col === 7) {
                            setIsBlackQueenKingSideRookMoved(true)

                        }
                    }

                }
            }

            setTurn((turn === "white") ? "black" : "white")
            setMoves([])


        }
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="rounded-lg shadow-lg cursor-pointer"
            />

        </div>
    );
}
