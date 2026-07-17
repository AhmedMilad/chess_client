import { useState, useEffect, useRef, Fragment } from "react";
import { ClipLoader } from "react-spinners";
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
    notationToIndex,
    getMoveNotation,
    Piece,
    fenToBoard
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
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate, } from "react-router-dom";

export default function AnalysisBoard() {

    const { id } = useParams();
    const rows = 8;
    const cols = 8;
    const size = 750;

    const cellSize = size / 8;
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const [board, setBoard] = useState([]);
    const [oldBoard, setOldBoard] = useState([]);
    const [images, setImages] = useState({});

    const [turn, setTurn] = useState("white");
    const imageScale = 0.75;
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [isRightDragging, setIsRightDragging] = useState(false);

    const [moves, setMoves] = useState([]);
    const [enpassantSquare, setEnpassantSquare] = useState(null);
    const [lines, setLines] = useState([]);
    const [engineLines, setEngineLines] = useState([]);
    const startPosRef = useRef(null);

    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const darkRed = "#880808";
    const lightRed = "#FF6666";
    const [canWhiteKingSideCastle, setCanWhiteKingSideCastle] = useState(true)
    const [canWhiteLongCastle, setCanWhiteLongCastle] = useState(true)

    const [canBlackKingSideCastle, setCanBlackKingSideCastle] = useState(true)
    const [canBlackLongCastle, setCanBlackLongCastle] = useState(true)

    const [isOriginalPerspective, setIsOriginalPerspective] = useState(true)
    const [isMateFound, setIsMateFound] = useState(false)
    const [stepsToMate, setStepsToMate] = useState(0)

    const [isEngineReady, setIsEngineReady] = useState(false);
    const [worker, setWorker] = useState(null)

    const scrollRef = useRef(null);
    const [opponentUserName, setOpponentUserName] = useState(null)
    const [opponentPointsDelta, setOpponentPointsDelta] = useState(0)
    const [movesHistory, setMovesHistory] = useState([]);
    const [username, setUserName] = useState(null)
    const [pointsDelta, setPointsDelta] = useState(0)

    const [rating, setRating] = useState(0)
    const [opponentRating, setOpponentRating] = useState(0)

    const [promotionPiece, setPromotionPiece] = useState(null)
    const [isGameAnalysis, setIsGameAnalysis] = useState(false);

    const promotionCanvas = useRef(null);

    const [isPawnPromotion, setIsPawnPromotion] = useState(false)
    const [previousMove, setPreviousMove] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const [playerSummary, setPlayerSummary] = useState(null)
    const [opponentSummary, setOpponentSummary] = useState(null)

    const lightBoysenberry = "#873260";
    const darkBoysenberry = "#6C284D";

    const [canvasDisplaySize, setCanvasDisplaySize] = useState(size);
    const [highlightBoard, setHighLightBoard] = useState(Array.from({ length: 16 }, () => Array(16).fill(false)));


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setCanvasDisplaySize(entry.contentRect.height);
            }
        });

        observer.observe(canvas);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let activeWorker = null;

        if (isGameAnalysis) {
            activeWorker = new Worker("/stockfish.js");
            setWorker(activeWorker);
        } else {
            setBoardEvaluation(0);
            setEngineLines([]);
            setWorker(null);
        }

        return () => {
            if (activeWorker) {
                activeWorker.terminate();
            }

            if (worker) {
                worker.terminate();
            }
        };
    }, [isGameAnalysis]);

    function drawPromotionBoard() {
        const canvas = promotionCanvas.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");

        for (let col = 0; col < 4; col++) {
            let color = col % 2 === 0 ? lightColor : darkColor;
            ctx.fillStyle = color;
            ctx.fillRect(col * cellSize, 0, cellSize, cellSize);
        }

        const pieces = ["q", "r", "b", "n"];

        const prefix = (turn === "white") ? "b" : "w";

        for (let i = 0; i < 4; i++) {
            const img = images[prefix + pieces[i]];

            if (!img || !img.complete || img.width === 0) continue;

            const aspect = img.width / img.height;
            let imgWidth, imgHeight;

            imgHeight = cellSize * imageScale;
            imgWidth = imgHeight * aspect;

            const offsetX = (cellSize - imgWidth) / 2;
            const offsetY = (cellSize - imgHeight) / 2;

            ctx.drawImage(
                img,
                (i * cellSize) + offsetX,
                offsetY,
                imgWidth,
                imgHeight
            );
        }
    }


    useEffect(() => {
        const canvas = promotionCanvas.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");
        drawPromotionBoard(ctx);

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        const handleMouseDown = (e) => {
            const pos = getMousePos(e);
            const col = Math.floor(pos.x / cellSize);
            const row = Math.floor(pos.y / cellSize);

            if (e.button === 0) {
                if (row === 0) {
                    switch (col) {
                        case 0:
                            let queen = "Q"
                            if (!isOriginalPerspective) {
                                queen = "q"
                            }

                            setPromotionPiece(queen)
                            break;
                        case 1:
                            let rook = "R"
                            if (!isOriginalPerspective) {
                                rook = "r"
                            }

                            setPromotionPiece(rook)
                            break;
                        case 2:
                            let bishop = "B"

                            if (!isOriginalPerspective) {
                                bishop = "b"
                            }

                            setPromotionPiece(bishop)
                            break;
                        case 3:

                            let knight = "N"

                            if (!isOriginalPerspective) {
                                knight = "n"
                            }
                            setPromotionPiece(knight)

                            break;
                        default:
                            console.log("invalid piece")
                    }
                }
            }
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("contextmenu", handleContextMenu);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [
        cellSize,
        images,
        drawPromotionBoard,
    ]);

    useEffect(() => {

        if (worker === null) {
            return
        }

        worker.onmessage = (e) => {
            const line = e.data;

            let mateLines = line.split(" mate ");

            if (mateLines.length > 1) {

                mateLines = mateLines[1].split(" ")

                const steps = parseInt(mateLines[0])

                if (mateLines.length > 0) {
                    setStepsToMate(steps)
                }

                if (steps > 0) {

                    if (turn === "white") {
                        setBoardEvaluation(10)
                    } else {
                        setBoardEvaluation(-10)

                    }
                }

                setIsMateFound(true)

            } else {
                // this is because it will temporarily lose advantage while choosing pawn promotion
                if (!isPawnPromotion) {

                    let cpLines = line.split(" cp ");

                    if (cpLines.length > 1) {
                        let targettedCpLine = cpLines[1]
                        targettedCpLine = targettedCpLine.split(" ");

                        if (targettedCpLine.length > 0) {

                            let evaluation = parseFloat(targettedCpLine[0]) / 100
                            setBoardEvaluation((turn === 'white') ? evaluation : evaluation * -1)

                        }
                        setIsMateFound(false)

                    }
                }
            }

            let lines = line.split(" pv ");

            if (lines.length > 0) {
                let moveLines = lines[1]

                if (moveLines) {
                    moveLines = moveLines.split(" ");
                    if (moveLines.length > 0) {

                        //eliminate extra characters for now like promotion character
                        moveLines[0] = moveLines[0].slice(0, 4)

                        const from = moveLines[0].slice(0, 2);
                        const to = moveLines[0].slice(-2);

                        let fromIndex = notationToIndex(from, !isOriginalPerspective)
                        let toIndex = notationToIndex(to, !isOriginalPerspective)

                        setEngineLines([
                            {
                                start: [fromIndex[0], fromIndex[1]],
                                end: [toIndex[0], toIndex[1]],
                            },
                        ]);

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
        turn,
        isPawnPromotion
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

    const [evaluationHistory, setEvaluationHistory] = useState([])

    const values = evaluationHistory.map(d => d.score);
    const dataMax = Math.max(...values, 0);
    const dataMin = Math.min(...values, 0);
    const zeroOffset = dataMax / (dataMax - dataMin);

    function onMoveClick(e) {

        let board = e?.board
        let from = e?.from
        let to = e?.to
        let score = e?.score

        let fromIndex = notationToIndex(from, !isOriginalPerspective)
        let toIndex = notationToIndex(to, !isOriginalPerspective)

        updateBoard(board, [fromIndex, toIndex])
        setBoardEvaluation(score)

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

    const [boardEvaluation, setBoardEvaluation] = useState(evaluationHistory[0]?.score);
    const [whiteHeight, setWhiteHeight] = useState(getBarHeight(boardEvaluation));

    const [gameAnalysisResponse, setGameAnalysisResponse] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchAnalysis = async () => {
            const baseURL = process.env.REACT_APP_BACKEND_URL || "";

            const response = await axios.get(`${baseURL}/api/games/${id}/analyze`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200) {


                setIsOriginalPerspective((response?.data?.color === "white"))
                setGameAnalysisResponse(response?.data)


            }

        };

        fetchAnalysis();

    }, [id, navigate]);


    useEffect(() => {

        if (!gameAnalysisResponse) {
            return
        }

        const gameAnalysis = gameAnalysisResponse?.game_analysis || [];
        const userName = gameAnalysisResponse?.username;
        const opponentUserName = gameAnalysisResponse?.opponent_username;

        const rating = gameAnalysisResponse?.rating
        const opponentRating = gameAnalysisResponse?.opponent_rating

        const pointsDelta = gameAnalysisResponse?.points_delta
        const opponentPointsDelta = gameAnalysisResponse?.opponent_points_delta


        let movesHistory = []
        let prevBoardFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"

        gameAnalysisResponse?.game_analysis?.forEach((game, index) => {

            let fromIndex = notationToIndex(game?.from, !isOriginalPerspective)
            let toIndex = notationToIndex(game?.to, !isOriginalPerspective)

            let boardFen = game?.board?.split(" ")[0]
            let prevBoard = fenToBoard(prevBoardFen, true)
            let curBoard = fenToBoard(boardFen, !isOriginalPerspective)


            if (!isOriginalPerspective) {
                prevBoard = rotateMatrix180(prevBoard)
                curBoard = rotateMatrix180(curBoard)

            }


            prevBoardFen = boardFen

            let castlingStatus = game?.castling_status
            let enPass = game?.enpassant_square

            let canKingSideCastle = false
            let canLongCastle = false

            let promoteTo = ""

            if (index % 2 === 0) {
                if (castlingStatus.includes("k")) {
                    canKingSideCastle = true
                }

                if (castlingStatus.includes("q")) {
                    canLongCastle = true
                }
            } else {
                if (castlingStatus.includes("K")) {
                    canKingSideCastle = true
                }

                if (castlingStatus.includes("Q")) {
                    canLongCastle = true
                }
            }

            if (castlingStatus.includes("=")) {
                promoteTo = game?.move.at(-1)
            }

            movesHistory.push([getMoveNotation(fromIndex[0], fromIndex[1], toIndex[0], toIndex[1], canKingSideCastle, canLongCastle, isOriginalPerspective, enPass, promoteTo, ((index % 2 === 0) ? "black" : "white"), prevBoard), getPositionFen(isOriginalPerspective, enPass, ((index % 2 === 0) ? "b" : "w"), curBoard), [[fromIndex[0], fromIndex[1]], [toIndex[0], toIndex[1]]], game?.score])

        });

        setMovesHistory(movesHistory)

        setEvaluationHistory([
            { move: "", score: 0.3, board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", from: "", to: "" },
            ...gameAnalysis
        ]);

        setIsLoading(false)
        setBoardEvaluation(0.3)

        setUserName(userName)
        setOpponentUserName(opponentUserName)

        setPointsDelta(pointsDelta)
        setOpponentPointsDelta(opponentPointsDelta)

        setRating(rating)
        setOpponentRating(opponentRating)

        setPlayerSummary(gameAnalysisResponse?.player_summary)
        setOpponentSummary(gameAnalysisResponse?.opponent_summary)

    }, [gameAnalysisResponse, isOriginalPerspective])


    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const handleContextMenu = (e) => {
            e.preventDefault();
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
    }, [images, draggingPiece, moves, board]);

    function drawArrow(ctx, start, end, color = "red", lineWidth = 20, cellSize = 75) {
        if (!start || !end) {
            return
        }

        const [sRow, sCol] = start;
        const [eRow, eCol] = end;

        const sx = sCol * cellSize + cellSize / 2;
        const sy = sRow * cellSize + cellSize / 2;
        const ex = eCol * cellSize + cellSize / 2;
        const ey = eRow * cellSize + cellSize / 2;

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

                if (highlightBoard[row][col]) {
                    color = (row + col) % 2 === 0 ? lightRed : darkRed
                }

                if (previousMove.length > 0) {
                    let [from, to] = previousMove
                    if ((row === from[0] && col === from[1]) || (row === to[0] && col === to[1])) {
                        color = (row + col) % 2 === 0 ? lightBoysenberry : darkBoysenberry
                    }
                }


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
        engineLines.forEach(({ start, end }) => drawArrow(ctx, start, end, "green", cellSize / 4, cellSize));

        if (isRightDragging && startPosRef.current && mousePos) {
            drawArrow(
                ctx,
                [
                    Math.floor(startPosRef.current.y / cellSize),
                    Math.floor(startPosRef.current.x / cellSize),
                ],
                [
                    Math.floor(mousePos.y / cellSize),
                    Math.floor(mousePos.x / cellSize),
                ],
                "orange",
                cellSize / 4,
                cellSize
            );
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
        lines,
        engineLines
    ])

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
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
            startPosRef.current = pos;
            setMousePos(pos);
            setIsRightDragging(true);
            return;
        } else if (e.button === 0) {
            if (!isPawnPromotion && piece && piece.isPlayable) {

                setDraggingPiece({ piece, row, col });
                setMousePos(pos)

                if ((turn === "white" && piece?.name[0] === 'w') || (turn === "black" && piece?.name[0] === 'b')) {
                    setMoves(getPieceMoves(row, col, piece, board));

                }

            } else {
                setMoves([])

            }
            setHighLightBoard(Array.from({ length: 16 }, () => Array(16).fill(false)));
            setLines([])
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

            let sPos = startPosRef.current

            if (sPos) {
                const sCol = Math.floor(sPos.x / cellSize);
                const sRow = Math.floor(sPos.y / cellSize);

                if (sCol === newCol && sRow === newRow) {
                    setHighLightBoard(prev => {
                        const board = prev.map(row => [...row]);
                        board[sRow][sCol] = true;
                        return board;
                    });

                } else {

                    setLines(prev => [
                        ...prev,
                        {
                            start: [sRow, sCol],
                            end: [newRow, newCol],
                        },
                    ]);
                }
            }

            setIsRightDragging(false);
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
            const trn = turn

            let enPass = enpassantSquare
            let brd = board
            setOldBoard(brd)

            let isKingSideCastle = false
            let isLongCastle = false
            let addMoveToHistory = true

            let posBoard = ""
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

                            if (isOriginalPerspective) {
                                isKingSideCastle = true
                            } else {
                                isLongCastle = true
                            }

                        } else {

                            newBoard = swapBoardPieces(newRow, 0, newRow, newCol + 1, brd)

                            if (isOriginalPerspective) {
                                isLongCastle = true
                            } else {
                                isKingSideCastle = true
                            }

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

                posBoard = newBoard

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

                        enPass = coordinatesToNotation(newRow, newCol, !isOriginalPerspective)
                        if (turn === "white") {
                            // might need a validation here
                            setEnpassantSquare(enPass)
                        } else {
                            setEnpassantSquare(enPass)
                        }

                    } else {

                        if (turn === "white") {
                            setEnpassantSquare(enPass)
                        } else {
                            setEnpassantSquare(enPass)
                        }

                    }

                } else {
                    setEnpassantSquare(null)
                }

                if (isOriginalPerspective) {
                    if ((turn === "white" && newRow === 0) || (turn === "black" && newRow === 7)) {
                        setIsPawnPromotion(true)
                        addMoveToHistory = false
                    }
                } else {
                    if ((turn === "white" && newRow === 7) || (turn === "black" && newRow === 0)) {
                        setIsPawnPromotion(true)
                        addMoveToHistory = false
                    }
                }

            } else {
                setEnpassantSquare(null)

            }

            setPreviousMove([[piece?.row, piece?.col], [newRow, newCol]])
            setTurn((turn === "white") ? "black" : "white")
            setMoves([])
            setLines([]);

            if (addMoveToHistory) {

                setMovesHistory((prev) => {

                    return [...prev, [getMoveNotation(piece?.row, piece?.col, newRow, newCol, isKingSideCastle, isLongCastle, isOriginalPerspective, enPass, "", trn, brd), getPositionFen(isOriginalPerspective, enPass, (trn === "white") ? "b" : "w", posBoard), [[piece?.row, piece?.col], [newRow, newCol]]]]
                })
            }
        }
    }

    useEffect(() => {
        if (promotionPiece === null) {
            return;
        }

        const fromRow = previousMove[0][0];
        const fromCol = previousMove[0][1];

        const toRow = previousMove[1][0];
        const toCol = previousMove[1][1];

        let pn = (turn === "white") ? "b" : "w"

        pn += promotionPiece.toLowerCase()

        let piece = new Piece(pn, pieceImages[pn], 0);

        piece.isPlayable = true

        let brd = ""

        setBoard(prev => {
            const newBoard = structuredClone(prev);
            newBoard[toRow][toCol] = piece;
            brd = newBoard
            return newBoard;
        });

        setPromotionPiece(null);
        setIsPawnPromotion(false);

        setMovesHistory((prev) => {

            return [...prev, [getMoveNotation(fromRow, fromCol, toRow, toCol, false, false, isOriginalPerspective, null, promotionPiece.toLowerCase(), turn, oldBoard), getPositionFen(isOriginalPerspective, null, (pn[0] === "w") ? "b" : "w", brd), [[fromRow, fromCol], [toRow, toCol]]]]
        })

    }, [
        previousMove,
        oldBoard,
        promotionPiece
    ]);


    useEffect(() => {

        if (worker !== null && isEngineReady && turn && board?.length > 0) {

            const turnCol = turn[0]
            const boardFen = getFenFromBoard(board, turnCol, isOriginalPerspective)

            let enSqr = "-"

            if (enpassantSquare !== null) {
                enSqr = enpassantSquare
            }

            let castleStatus = ""

            if (canWhiteKingSideCastle) {
                castleStatus += "K"
            }

            if (canWhiteLongCastle) {
                castleStatus += "Q"
            }

            if (canBlackKingSideCastle) {
                castleStatus += "k"
            }

            if (canBlackLongCastle) {
                castleStatus += "q"
            }

            if (isEngineReady) {
                worker.postMessage(`position fen ${boardFen} ${turnCol} ${castleStatus} ${enSqr} 0 1`);
                worker.postMessage("go depth 15");
            }

        }
    }, [
        board,
        turn,
        worker,
        isOriginalPerspective,
        isEngineReady,
        enpassantSquare,
        canBlackKingSideCastle,
        canBlackLongCastle,
        canWhiteKingSideCastle,
        canWhiteLongCastle,
    ])

    function getPositionFen(isOriginalPerspective, enpassantSquare, turn, board) {
        let boardFen = getFenFromBoard(board, turn, isOriginalPerspective)

        let enSqr = "-"

        if (enpassantSquare !== null) {
            enSqr = enpassantSquare
        }

        let castleStatus = ""

        if (canWhiteKingSideCastle) {
            castleStatus += "K"
        }

        if (canWhiteLongCastle) {
            castleStatus += "Q"
        }

        if (canBlackKingSideCastle) {
            castleStatus += "k"
        }

        if (canBlackLongCastle) {
            castleStatus += "q"
        }

        boardFen = boardFen.split(" ")
        return `${boardFen[0]} ${turn} ${castleStatus} ${enSqr} 0 1`
    }

    function updateBoard(fen, prevMoveData, score) {

        if (typeof fen !== "string") {
            return
        }

        fen = fen.split(" ")

        let brd = fenToAnalysisBoard(fen[0]);

        if (!isOriginalPerspective) {
            brd = rotateMatrix180(brd)

        }

        if (fen.length > 0) {
            let turn = fen[1]
            if (turn === 'w') {
                setTurn("white")
            } else {
                setTurn("black")
            }

        }

        if (fen.length > 1) {
            const str = fen[2];

            for (const char of str) {
                if (char === "K") {
                    setCanWhiteKingSideCastle(true)
                }

                if (char === "Q") {
                    setCanWhiteLongCastle(true)
                }

                if (char === "k") {
                    setCanBlackKingSideCastle(true)
                }

                if (char === "q") {
                    setCanBlackLongCastle(true)
                }
            }
        }

        if (fen.length > 2) {
            const enPass = fen[3]

            if (enPass !== "-") {
                setEnpassantSquare(enPass)
            }
        }

        if (Array.isArray(prevMoveData) && prevMoveData.length > 1) {
            const from = prevMoveData[0]
            const to = prevMoveData[1]

            setPreviousMove([[from[0], from[1]], [to[0], to[1]]]);

        }

        if (score) {
            setBoardEvaluation(score)
        }

        setMoves([])
        setBoard(brd)
    }

    function toggleEngineAnalysis() {
        setIsGameAnalysis(!isGameAnalysis)
    }

    function home() {
        navigate("/");
    }

    useEffect(() => {
        setWhiteHeight(getBarHeight(boardEvaluation))
    }, [
        boardEvaluation
    ])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [movesHistory]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-3 sm:p-6">
            <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-4 lg:gap-6 items-stretch">

                <div className="flex flex-col flex-1 gap-4 w-full min-w-0">
                    {isPawnPromotion && (
                        <canvas
                            ref={promotionCanvas}
                            width={cellSize * 4}
                            height={cellSize}
                            className="shadow-lg cursor-pointer mx-auto my-4 max-w-full h-auto"
                        />
                    )}

                    <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 w-full">

                        {(
                            () => {

                                if (isOriginalPerspective) {
                                    return (
                                        <div
                                            className="relative w-4 sm:w-6 rounded flex flex-col overflow-hidden bg-black border border-neutral-700 shadow-inner shrink-0"
                                            style={{ height: `${canvasDisplaySize}px` }}
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-white transition-all duration-200 ease-in-out"
                                                style={{ height: `${whiteHeight}%` }}
                                            />

                                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-500 opacity-50 pointer-events-none" />

                                            <div className="absolute inset-x-0 bottom-2 text-center font-sans font-bold text-[9px] sm:text-[11px] pointer-events-none z-10 mix-blend-difference text-white">

                                                {(() => {
                                                    if (isMateFound) {
                                                        return `m${stepsToMate}`
                                                    } else {
                                                        return boardEvaluation > 0 ? `+${boardEvaluation?.toFixed(1)}` : boardEvaluation?.toFixed(1)
                                                    }
                                                })()}

                                            </div>
                                        </div>
                                    )

                                } else {
                                    return (
                                        <div
                                            className="relative w-4 sm:w-6 rounded flex flex-col overflow-hidden bg-white border border-neutral-700 shadow-inner shrink-0"
                                            style={{ height: `${canvasDisplaySize}px` }}
                                        >
                                            <div
                                                className="absolute bottom-0 w-full bg-black transition-all duration-200 ease-in-out"
                                                style={{ height: `${whiteHeight}%` }}
                                            />

                                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-500 opacity-50 pointer-events-none" />

                                            <div className="absolute inset-x-0 bottom-2 text-center font-sans font-bold text-[9px] sm:text-[11px] pointer-events-none z-10 mix-blend-difference text-white">

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
                            className="rounded-lg shadow-lg cursor-pointer bg-neutral-800 max-w-full h-auto"
                        />
                    </div>

                    <div className="w-full h-[160px] sm:h-[200px] bg-[#1e1e1e] p-3 sm:p-[15px] rounded-lg">
                        <h3 className="text-white m-0 mb-2 font-sans text-sm">
                            Game Evaluation
                        </h3>

                        <style>{`
                        .no-outline-chart:focus,
                        .no-outline-chart g:focus,
                        .no-outline-chart path:focus,
                        .no-outline-chart .recharts-wrapper:focus {
                            outline: none !important;
                            box-shadow: none !important;
                        }
                    `}</style>


                        {(() => {

                            if (isLoading) {

                                return (
                                    <div className="p-8 m-auto">
                                        <ClipLoader
                                            color="#ffffff"
                                            size={40}
                                            aria-label="Loading"
                                        />
                                    </div>
                                )
                            } else {
                                return (

                                    <>
                                        <style>{`
                                        .no-outline-chart .recharts-wrapper:focus,
                                        .no-outline-chart .recharts-wrapper:focus-visible,
                                        .no-outline-chart .recharts-surface:focus,
                                        .no-outline-chart .recharts-surface:focus-visible,
                                        .no-outline-chart svg:focus,
                                        .no-outline-chart svg:focus-visible {
                                            outline: none !important;
                                        }
                                    `}</style>
                                        <ResponsiveContainer width="100%" height="85%" className="no-outline-chart">
                                            <AreaChart
                                                data={evaluationHistory}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                style={{ outline: 'none' }}
                                                onClick={(nextState) => {

                                                    if (nextState && nextState.activeTooltipIndex !== undefined) {

                                                        const index = parseInt(nextState.activeTooltipIndex, 10);
                                                        const clickedData = evaluationHistory[index];

                                                        if (clickedData?.board) {
                                                            onMoveClick({
                                                                board: clickedData.board,
                                                                from: clickedData.from,
                                                                to: clickedData.to,
                                                                score: clickedData.score,
                                                            });
                                                        }
                                                    }
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient id="lichessSplit" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset={zeroOffset} stopColor="#ffffff" stopOpacity={1} />
                                                        <stop offset={zeroOffset} stopColor="#000000" stopOpacity={1} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="move" stroke="#777" tick={{ fill: '#bbb', fontSize: 12 }} />
                                                <YAxis
                                                    domain={[-10, 10]}
                                                    stroke="#777"
                                                    tick={{ fill: '#bbb', fontSize: 12 }}
                                                    tickFormatter={(value) => (value > 0 ? `+${value}` : value)}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}
                                                    labelStyle={{ color: '#fff' }}
                                                    itemStyle={{ color: '#8884d8' }}
                                                    formatter={(value, name, props) => [`Score: ${props.payload.score}`, 'Evaluation']}
                                                />
                                                <ReferenceLine y={0} stroke="#555" strokeDasharray="3 3" />
                                                <Area
                                                    dataKey="score"
                                                    stroke="#777"
                                                    fill="url(#lichessSplit)"
                                                    strokeWidth={2}
                                                    baseValue={0}
                                                    activeDot={{ r: 6, style: { outline: 'none' } }}
                                                    isAnimationActive={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </>

                                )
                            }

                        })()}

                    </div>
                </div>

                <div className="flex flex-col w-full lg:w-96 shrink-0">

                    <div className="p-2 sm:p-4">
                        {(() => {

                            return (
                                <div>
                                    <button
                                        onClick={toggleEngineAnalysis}
                                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-white border-none cursor-pointer"
                                        style={{
                                            backgroundColor: !isGameAnalysis ? '#4CAF50' : '#f44336',
                                        }}
                                    >
                                        {!isGameAnalysis ? 'Turn on engine' : 'Turn off engine'}
                                    </button>
                                    <button
                                        onClick={home}
                                        className="mx-4 px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-white border-none cursor-pointer bg-blue-500"
                                    >
                                        Home
                                    </button>

                                </div>
                            );

                        })()}

                        <div className="flex justify-between items-center text-white text-lg sm:text-xl">
                            <div className="flex flex-col mt-4">
                                <span>{opponentUserName}</span>
                                <span className="text-sm text-gray-400">
                                    {opponentRating}
                                    {(
                                        <span
                                            style={{
                                                color:
                                                    opponentPointsDelta > 0
                                                        ? "green"
                                                        : opponentPointsDelta < 0
                                                            ? "red"
                                                            : undefined
                                            }}
                                        >
                                            {opponentPointsDelta > 0
                                                ? ` +${opponentPointsDelta}`
                                                : ` ${opponentPointsDelta}`}
                                        </span>
                                    )}
                                </span>
                            </div>

                        </div>
                    </div>

                    <div className="w-full mx-auto lg:mx-4 bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden flex flex-col">

                        {(() => {

                            if (isLoading) {
                                return (

                                    <div className="bg-gray-800/90 p-4 border-b border-gray-600 flex flex-col gap-2 font-sans select-none">
                                        <div className="mx-auto">
                                            <ClipLoader
                                                color="#ffffff"
                                                size={18}
                                                aria-label="Loading"
                                            />
                                        </div>
                                    </div>
                                )
                            } else {

                                return (

                                    <div className="bg-gray-800/90 p-3 sm:p-4 border-b border-gray-600 flex flex-col gap-2 font-sans select-none">
                                        <div className="flex justify-between items-center text-gray-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold px-1 mb-1">
                                            <span>White</span>
                                            <span>Analysis</span>
                                            <span>Black</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-900/40 hover:bg-gray-900/70 transition px-2 sm:px-3 py-1.5 rounded-md">
                                            <span className="text-white font-bold text-left w-8 sm:w-10">{isOriginalPerspective ? playerSummary.best : opponentSummary.best}</span>
                                            <span className="text-emerald-400 font-semibold text-center bg-emerald-500/10 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs border border-emerald-500/20 shadow-sm w-24 sm:w-28">Best Move</span>
                                            <span className="text-white font-bold text-right w-8 sm:w-10">{!isOriginalPerspective ? playerSummary.best : opponentSummary.best}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-900/40 hover:bg-gray-900/70 transition px-2 sm:px-3 py-1.5 rounded-md">
                                            <span className="text-white font-bold text-left w-8 sm:w-10">{isOriginalPerspective ? playerSummary.excellent : opponentSummary.excellent}</span>
                                            <span className="text-blue-400 font-semibold text-center bg-blue-500/10 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs border border-blue-500/20 shadow-sm w-24 sm:w-28">Excellent</span>
                                            <span className="text-white font-bold text-right w-8 sm:w-10">{!isOriginalPerspective ? playerSummary.excellent : opponentSummary.excellent}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-900/40 hover:bg-gray-900/70 transition px-2 sm:px-3 py-1.5 rounded-md">
                                            <span className="text-white font-bold text-left w-8 sm:w-10">{isOriginalPerspective ? playerSummary.good : opponentSummary.good}</span>
                                            <span className="text-gray-300 font-semibold text-center bg-gray-500/10 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs border border-gray-500/20 shadow-sm w-24 sm:w-28">Good</span>
                                            <span className="text-white font-bold text-right w-8 sm:w-10">{!isOriginalPerspective ? playerSummary.good : opponentSummary.good}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-900/40 hover:bg-gray-900/70 transition px-2 sm:px-3 py-1.5 rounded-md">
                                            <span className="text-white font-bold text-left w-8 sm:w-10">{isOriginalPerspective ? playerSummary.inaccuracy : opponentSummary.inaccuracy}</span>
                                            <span className="text-yellow-500 font-semibold text-center bg-yellow-500/10 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs border border-yellow-500/20 shadow-sm w-24 sm:w-28">Inaccuracy</span>
                                            <span className="text-white font-bold text-right w-8 sm:w-10">{!isOriginalPerspective ? playerSummary.inaccuracy : opponentSummary.inaccuracy}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-900/40 hover:bg-gray-900/70 transition px-2 sm:px-3 py-1.5 rounded-md">
                                            <span className="text-white font-bold text-left w-8 sm:w-10">{isOriginalPerspective ? playerSummary.mistake : opponentSummary.mistake}</span>
                                            <span className="text-orange-500 font-semibold text-center bg-orange-500/10 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs border border-orange-500/20 shadow-sm w-24 sm:w-28">Mistake</span>
                                            <span className="text-white font-bold text-right w-8 sm:w-10">{!isOriginalPerspective ? playerSummary.mistake : opponentSummary.mistake}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-900/40 hover:bg-gray-900/70 transition px-2 sm:px-3 py-1.5 rounded-md">
                                            <span className="text-white font-bold text-left w-8 sm:w-10">{isOriginalPerspective ? playerSummary.blunder : opponentSummary.blunder}</span>
                                            <span className="text-red-500 font-semibold text-center bg-red-500/10 px-2 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs border border-red-500/20 shadow-sm w-24 sm:w-28">Blunder</span>
                                            <span className="text-white font-bold text-right w-8 sm:w-10">{!isOriginalPerspective ? playerSummary.blunder : opponentSummary.blunder}</span>
                                        </div>
                                    </div>
                                )
                            }

                        })()}

                        <div className="bg-gray-700 text-white p-2 text-center font-semibold">
                            Moves
                        </div>
                        <div ref={scrollRef} className="h-56 sm:h-72 overflow-y-auto">
                            <div className="grid grid-cols-2 text-white">

                                {movesHistory.map((move, index) => {
                                    if (index % 2 === 0) {
                                        const blackMove = movesHistory[index + 1];

                                        const getBadgeColor = (type) => {
                                            if (type === 'best') return 'text-emerald-400 font-medium'
                                            if (type === 'excellent') return 'text-blue-400'
                                            if (type === 'good') return 'text-gray-300'
                                            if (type === 'inaccuracy') return 'text-yellow-500'
                                            if (type === 'mistake') return 'text-orange-500'
                                            if (type === 'blunder') return 'text-red-500 font-bold underline decoration-red-500 decoration-2'
                                            return ''
                                        }

                                        return (
                                            <Fragment key={index}>
                                                <div
                                                    className={`border border-gray-600/50 text-center py-1.5 cursor-pointer hover:bg-gray-700 transition text-sm sm:text-base ${getBadgeColor(move[4])}`}
                                                    onClick={() => updateBoard(move[1], move[2], move[3])}
                                                >
                                                    {move[0]}
                                                </div>

                                                <div
                                                    className={`border border-gray-600/50 text-center py-1.5 cursor-pointer hover:bg-gray-700 transition text-sm sm:text-base ${getBadgeColor(blackMove?.[4])}`}
                                                    onClick={() => blackMove && updateBoard(blackMove[1], blackMove[2], blackMove[3])}
                                                >
                                                    {blackMove?.[0] || ""}
                                                </div>
                                            </Fragment>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="p-2 sm:p-4">
                        <div className="flex justify-between items-center text-white text-lg sm:text-xl">
                            <div className="flex flex-col">
                                <span>{username}</span>
                                <span className="text-sm">
                                    {rating}
                                    {(
                                        <span
                                            style={{
                                                color:
                                                    pointsDelta > 0
                                                        ? "green"
                                                        : pointsDelta < 0
                                                            ? "red"
                                                            : undefined
                                            }}
                                        >
                                            {pointsDelta > 0
                                                ? ` +${pointsDelta}`
                                                : ` ${pointsDelta}`}
                                        </span>
                                    )}
                                </span>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
