import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { ClipLoader } from "react-spinners";
import { sendMessage, connectWebSocket } from "../utils/websocket";
import { fenToBoard, Piece, rotateMatrix180 } from "../utils/game"
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

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
    getWPawnPreMoves,
    getBPawnPreMoves,
    getKnightPreMoves,
    getKingPreMoves,
    getHorizontalPreMoves,
    getVerticalPreMoves,
    getMainDiagonalPreMoves,
    getAntiDiagonalPreMoves,
    getNumberOfChecks,
    notationToIndex,
    coordinatesToNotation
} from "../utils/game"

export default function ChessBoard({ size = 750, message, gameBoard }) {


    const [gameId, setGameID] = useState(message.game_id)
    const [preMoves, setPreMoves] = useState([]);
    const socketRef = useRef(null);
    const navigate = useNavigate();

    const [isBlack, setIsBlack] = useState(false)

    const [board, setBoard] = useState([]);

    const canvasRef = useRef(null);
    const [images, setImages] = useState({});
    const [draggingPiece, setDraggingPiece] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [moves, setMoves] = useState([]);
    const [turn, setTurn] = useState(false)
    const [isCheckMate, setIsCheckMate] = useState(false)
    const [isRightDragging, setIsRightDragging] = useState(false);
    const [startPos, setStartPos] = useState(null);
    const [lines, setLines] = useState([]);
    const [previousMove, setPreviousMove] = useState([]);
    const [previousRightClickCords, setPreviousRightClickCords] = useState([]);
    const [currentPiece, setCurrentPiece] = useState(null);
    localStorage.setItem("boardPosition", []);
    const [boardPosition, setBoardPosition] = useState(() => {
        const boardPosition = localStorage.getItem("boardPosition");
        return boardPosition ? JSON.parse(boardPosition) : [];
    });
    const [winner, setWinner] = useState()
    const [movesHistory, setMovesHistory] = useState([]);
    const scrollRef = useRef(null);
    const [boardCol, setBoardCol] = useState(Array.from({ length: 16 }, () => Array(16).fill(0)));
    const [highlightBoard, setHighLightBoard] = useState(Array.from({ length: 16 }, () => Array(16).fill(false)));
    const [enpassantSquare, setEnpassantSquare] = useState(null);

    const rows = 8;
    const cols = 8;
    const cellSize = size / 8;
    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";
    const lightBlue = "#2E90F2";
    const darkBlue = "#073B6E";
    const darkRed = "#880808";
    const lightRed = "#FF6666";
    const lightGreen = "#008000";
    const darkGreen = "#0F4D0F";
    const lightBoysenberry = "#873260";
    const darkBoysenberry = "#6C284D";
    const imageScale = 0.75;

    const { id } = useParams()
    const token = localStorage.getItem("token");

    const formatTime = (t) => {
        const totalSeconds = Math.floor(t / 1000);

        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;

        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const [socketMessage, setSocketMessage] = useState(message);
    const [canKingSideCastle, setCanKingSideCastle] = useState(false)
    const [canLongCastle, setCanLongCastle] = useState(false)
    const [myTime, setMyTime] = useState(null)
    const [opponentTime, setOpponentTime] = useState(null)
    const [isDraw, setIsDraw] = useState(false)
    const [isWin, setIsWin] = useState(false)
    const [isDefeat, setIsDefeat] = useState(false)
    const [isPawnPromotion, setIsPawnPromotion] = useState(false)
    const promotionCanvas = useRef(null);
    const [promotionPiece, setPromotionPiece] = useState(null)
    const [previousPreMove, setPreviousPreMove] = useState([])
    const [playerInfo, setPlayerInfo] = useState(null)
    const [opponentInfo, setOpponentInfo] = useState(null)
    const [myPointsDelta, setMyPointsDelta] = useState(0)
    const [opponentPointsDelta, setOpponentPointsDelta] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)
    const [cancelDrawOffer, setCancelDrawOffer] = useState(false)
    const [confirmResign, setConfirmResign] = useState(false)
    const [loadNewGame, setLoadNewGame] = useState(false)
    const [isRematchOffered, setIsRematchOffered] = useState(false)
    const [isRematchAvailable, setIsRematchAvailable] = useState(false)
    const [isDrawAvailable, setIsDrawAvailable] = useState(false)
    const [loading, setLoading] = useState(true);
    const [orgBoard, setOrgBoard] = useState(null)

    useEffect(() => {

        if (promotionPiece === null || !isPawnPromotion) return

        if (turn) {
            let [from, to] = previousMove

            if (from?.length !== 2) return
            if (to?.length !== 2) return

            let fromNotation = coordinatesToNotation(from[0], from[1], isBlack)
            let toNotation = coordinatesToNotation(to[0], to[1], isBlack)


            let color = "w"

            if (isBlack) {
                color = "b"
            }

            sendMessage({
                "game_id": gameId,
                "type": "move",
                "color": color,
                "data": {
                    "from": fromNotation,
                    "to": toNotation,
                },
                "promote_to": promotionPiece,
            });
        } else {

            let [from, to] = previousPreMove

            if (from?.length !== 2) return
            if (to?.length !== 2) return

            setPreMoves([...preMoves, {
                from: [from[0], from[1]],
                to: [to[0], to[1]],
                promote_to: promotionPiece,
            }]);

            let prefix = "w"

            if (isBlack) {
                prefix = "b"
            }

            let pn = prefix + promotionPiece.toLowerCase()

            let piece = new Piece(pn, pieceImages[pn], 0); //TODO remove the weight attribute.

            piece.isPlayable = true

            setBoard(prev => {
                const newBoard = structuredClone(prev);
                newBoard[from[0]][from[1]] = null;
                newBoard[to[0]][to[1]] = piece;
                return newBoard;
            });

            setMoves([])

        }

        setIsPawnPromotion(false)
        setPromotionPiece(null)

    }, [promotionPiece, previousMove, isBlack, gameId, isPawnPromotion, turn, previousPreMove, preMoves])

    useEffect(() => {
        const ws = socketRef.current;
        if (!ws) return;

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            setSocketMessage(data);
        };

        ws.addEventListener("message", handleMessage);

        return () => {
            ws.removeEventListener("message", handleMessage);
        };
    }, [socketRef.current]);


    useEffect(() => {

        if (socketMessage !== null && (Object.hasOwn(socketMessage, 'type')) && socketMessage.type === "start_game") {

            navigate(`/games/${socketMessage.game_id}`, { state: { message: socketMessage } });


            setIsBlack(socketMessage?.color === "black")
            setTurn(socketMessage?.color !== "black")


            setIsDraw(false)
            setIsWin(false)
            setIsDefeat(false)
            setLoading(false)
            setLoadNewGame(false)

            setMovesHistory([])

            setGameID(socketMessage.game_id)

            if (Object.hasOwn(socketMessage, 'board')) {

                let brd = fenToBoard(socketMessage.board, (socketMessage?.color === "black"));

                if (Object.hasOwn(socketMessage, "data") && socketMessage.data != null && Object.hasOwn(socketMessage.data, "from") && Object.hasOwn(socketMessage.data, "to")) {
                    let from = socketMessage.data.from;
                    let to = socketMessage.data.to;
                    let fromIndexes = notationToIndex(from, isBlack);
                    let toIndexes = notationToIndex(to, isBlack);
                    let [fromRow, fromCol] = fromIndexes;
                    let [toNewRow, toNewCol] = toIndexes;
                    setPreviousMove([[fromRow, fromCol], [toNewRow, toNewCol]]);

                }

                setBoard(brd);


                if (Object.hasOwn(socketMessage, 'my_time')) {
                    setMyTime(socketMessage.my_time)
                }

                if (Object.hasOwn(socketMessage, 'opponent_time')) {
                    setOpponentTime(socketMessage.opponent_time)
                }

            }

            setIsRematchAvailable(false)
            setIsRematchOffered(false)

            setIsDrawAvailable(false)
            setCancelDrawOffer(false)
            setIsGameOver(false)
            setPreviousMove([])
            setPreMoves([])

            setEnpassantSquare("")
            setCanLongCastle(true)
            setCanKingSideCastle(true)
            setConfirmResign(false)

            if (Object.hasOwn(socketMessage, 'turn')) {
                const isMyTurn = socketMessage.color === "black" ? socketMessage.turn === 2 : socketMessage.turn === 1;
                setTurn(isMyTurn);
            }

            return
        }

        if (socketMessage === null || ((Object.hasOwn(socketMessage, 'game_id') && (Object.hasOwn(socketMessage, 'type') && socketMessage !== "start_game") && gameId !== socketMessage.game_id))) return;

        setGameID(socketMessage.game_id)

        if (Object.hasOwn(socketMessage, "color") && socketMessage.color === "black") {
            setIsBlack(true)
        }

        if (Object.hasOwn(socketMessage, 'type')) {

            if (socketMessage.type === "draw_available") {
                setIsDrawAvailable(true)
                return

            }

            if (socketMessage.type === "draw_offered") {
                setCancelDrawOffer(true)
                return

            }

            if (socketMessage.type === "cancel_draw" || socketMessage.type === "decline_draw") {
                setIsDrawAvailable(false)
                setCancelDrawOffer(false)
                return

            }


            if (socketMessage.type === "cancel_rematch") {
                if (Object.hasOwn(socketMessage, "is_rematch_available")) {
                    setIsRematchAvailable(socketMessage.is_rematch_available)

                }

                if (Object.hasOwn(socketMessage, "is_rematch_offered")) {
                    setIsRematchOffered(socketMessage.is_rematch_offered)

                }

                return

            }

            if (socketMessage.type === "rematch_available" && Object.hasOwn(socketMessage, "is_rematch_available")) {

                setIsRematchAvailable(socketMessage.is_rematch_available)
                return

            }


            if (socketMessage.type === "rematch_offered" && Object.hasOwn(socketMessage, "is_rematch_offered")) {
                setIsRematchOffered(socketMessage.is_rematch_offered)
                return

            }

            if (socketMessage.type === "pending_new_game") {
                setLoadNewGame(true)
                setLoading(true)

                return
            }

            if (socketMessage.type === "cancel_new_game") {
                setLoadNewGame(false)
                setLoading(false)

                return
            }

        }

        if (Object.hasOwn(socketMessage, "is_draw_available")) {
            setIsDrawAvailable(socketMessage.is_draw_available)

        }

        if (Object.hasOwn(socketMessage, "is_new_game_pending")) {
            setLoadNewGame(socketMessage.is_new_game_pending)
            setLoading(socketMessage.is_new_game_pending)

        }

        if (Object.hasOwn(socketMessage, "is_draw_offered")) {
            setCancelDrawOffer(socketMessage.is_draw_offered)

        }

        if (Object.hasOwn(socketMessage, "is_rematch_available")) {
            setIsRematchAvailable(socketMessage.is_rematch_available)

        }

        if (Object.hasOwn(socketMessage, "is_rematch_offered")) {
            setIsRematchOffered(socketMessage.is_rematch_offered)

        }


        if (Object.hasOwn(socketMessage, 'my_points_delta')) {
            setMyPointsDelta(parseInt(socketMessage.my_points_delta))
        }

        if (Object.hasOwn(socketMessage, 'opponent_points_delta')) {
            setOpponentPointsDelta(parseInt(socketMessage.opponent_points_delta))
        }

        if (Object.hasOwn(socketMessage, 'my_time')) {
            setMyTime(socketMessage.my_time)
        }

        if (Object.hasOwn(socketMessage, 'opponent_time')) {
            setOpponentTime(socketMessage.opponent_time)
        }

        if (Object.hasOwn(socketMessage, 'type')) {

            let isDraw = false
            let isWin = false
            let isDefeat = false


            if (Object.hasOwn(socketMessage, "status")) {
                if (socketMessage.status === "draw") {
                    isDraw = true
                }

                if (socketMessage.status === "win") {
                    isWin = true
                }

                if (socketMessage.status === "defeat") {
                    isDefeat = true
                }
            }

            if (Object.hasOwn(socketMessage, 'status') && socketMessage.status === 'draw') {

                if (Object.hasOwn(socketMessage, 'board')) {
                    let brd = fenToBoard(socketMessage.board, isBlack);

                    if (Object.hasOwn(socketMessage, "data") && socketMessage.data != null && Object.hasOwn(socketMessage.data, "from") && Object.hasOwn(socketMessage.data, "to")) {
                        let from = socketMessage.data.from;
                        let to = socketMessage.data.to;
                        let fromIndexes = notationToIndex(from, isBlack);
                        let toIndexes = notationToIndex(to, isBlack);
                        let [fromRow, fromCol] = fromIndexes;
                        let [toNewRow, toNewCol] = toIndexes;
                        setPreviousMove([[fromRow, fromCol], [toNewRow, toNewCol]]);

                    }

                    setBoard(brd);
                }

            }

            if (socketMessage.type === 'checkmate') {

                if (Object.hasOwn(socketMessage, 'board')) {
                    let brd = fenToBoard(socketMessage.board, isBlack);

                    if (isBlack) {
                        brd = rotateMatrix180(brd);
                    }

                    if (Object.hasOwn(socketMessage, "data") && socketMessage.data != null && Object.hasOwn(socketMessage.data, "from") && Object.hasOwn(socketMessage.data, "to")) {
                        let from = socketMessage.data.from;
                        let to = socketMessage.data.to;
                        let fromIndexes = notationToIndex(from, isBlack);
                        let toIndexes = notationToIndex(to, isBlack);
                        let [fromRow, fromCol] = fromIndexes;
                        let [toNewRow, toNewCol] = toIndexes;
                        setPreviousMove([[fromRow, fromCol], [toNewRow, toNewCol]]);

                    }

                    setBoard(brd);
                }

            }

            // might need to separate the logic in the future
            if (socketMessage.type === 'move' || socketMessage.type === 'reconnect_game') {

                let enpassantSqr = ""
                let canKingSideCastle = false
                let canLongCastle = false

                if (Object.hasOwn(socketMessage, 'turn')) {
                    const isMyTurn = isBlack ? socketMessage.turn === 2 : socketMessage.turn === 1;
                    setTurn(isMyTurn);
                }

                if (Object.hasOwn(socketMessage, 'enpassant_square')) {
                    enpassantSqr = socketMessage.enpassant_square;
                }

                if (Object.hasOwn(socketMessage, 'can_long_castle')) {
                    canLongCastle = socketMessage.can_long_castle;
                }

                if (Object.hasOwn(socketMessage, 'can_king_side_castle')) {
                    canKingSideCastle = socketMessage.can_king_side_castle;
                }

                if (Object.hasOwn(socketMessage, 'board')) {
                    let brd = fenToBoard(socketMessage.board, (socketMessage?.color === "black"));

                    if (Object.hasOwn(socketMessage, 'status')) {
                        const tmpBoardCol = Array.from({ length: 8 }, () => Array(8).fill(0));
                        setBoardCol(tmpBoardCol);

                        if (Object.hasOwn(socketMessage, "data") && socketMessage.data != null && Object.hasOwn(socketMessage.data, "from") && Object.hasOwn(socketMessage.data, "to")) {
                            let from = socketMessage.data.from;
                            let to = socketMessage.data.to;

                            let fromIndexes = notationToIndex(from, isBlack);
                            let toIndexes = notationToIndex(to, isBlack);

                            if (preMoves?.length > 0) {
                                for (const move of preMoves) {
                                    const [mvFromRow, mvFromCol] = move.from;
                                    const [mvToRow, mvToCol] = move.to;
                                    brd[mvToRow][mvToCol] = brd[mvFromRow][mvFromCol];
                                    brd[mvFromRow][mvFromCol] = null;
                                    tmpBoardCol[mvToRow][mvToCol]++;
                                }
                                setBoardCol(tmpBoardCol);
                            }

                            let [fromRow, fromCol] = fromIndexes;
                            let [toNewRow, toNewCol] = toIndexes;

                            setPreviousMove([[fromRow, fromCol], [toNewRow, toNewCol]]);
                        }
                    }
                    setBoard(brd);
                    setEnpassantSquare(enpassantSqr)
                    setCanKingSideCastle(canKingSideCastle)
                    setCanLongCastle(canLongCastle)
                }

            }

            if (isDraw) {
                setIsDraw(true)
            }

            if (isWin) {
                setIsWin(true)
            }

            if (isDefeat) {
                setIsDefeat(true)
            }

            if (isDraw || isDefeat || isWin) {
                setIsGameOver(true)
            }
        }

        if (Object.hasOwn(socketMessage, "moves") && Array.isArray(socketMessage.moves) && socketMessage.moves.length > 0) {
            setMovesHistory(socketMessage.moves);

        } else if (Object.hasOwn(socketMessage, "move_notation") && typeof socketMessage.move_notation !== 'undefined' && socketMessage.move_notation !== null && socketMessage.move_notation !== "") {

            setMovesHistory(prev => [...prev, socketMessage.move_notation]);

        }

        if (Object.hasOwn(socketMessage, "my_info")) {
            if (socketMessage.my_info?.username !== "" && socketMessage.my_info?.rating !== "") {
                setPlayerInfo(socketMessage.my_info)
            }

        }

        if (Object.hasOwn(socketMessage, "opponent_info")) {
            if (socketMessage.opponent_info?.username !== "" && socketMessage.opponent_info?.rating !== "") {
                setOpponentInfo(socketMessage.opponent_info)
            }

        }

    }, [socketMessage, isBlack]);

    useEffect(() => {

        if (socketMessage !== null && Object.hasOwn(socketMessage, "board") && socketMessage.board !== "") {
            let brd = fenToBoard(socketMessage.board, isBlack);

            if (isBlack) {
                brd = rotateMatrix180(brd);
            }

            setOrgBoard(brd)
            setBoard(brd);
        }

    }, [
        isBlack,
        socketMessage
    ])

    useEffect(() => {
        if (!turn || !preMoves || preMoves.length === 0 || !board) return;

        const [nextMove] = preMoves;
        const [fromRow, fromCol] = nextMove.from;
        const [toRow, toCol] = nextMove.to;

        let promoteTo = ""

        if (Object.hasOwn(nextMove, "promote_to")) {
            promoteTo = nextMove.promote_to
        }

        let piece = board[fromRow][fromCol];
        let fromNotation = coordinatesToNotation(fromRow, fromCol, isBlack);
        let toNotation = coordinatesToNotation(toRow, toCol, isBlack);

        setBoardCol(prev => {
            const newBoardCol = [...prev];
            newBoardCol[toRow] = [...newBoardCol[toRow]];

            if (newBoardCol[toRow][toCol] > 0) {
                newBoardCol[toRow][toCol]--;
            }

            return newBoardCol;
        });

        sendMessage({
            "game_id": gameId,
            "type": "move",
            "color": piece?.name[0],
            "data": {
                "from": fromNotation,
                "to": toNotation,
            },
            "promote_to": promoteTo
        });

        setPreMoves(prev => {
            const [, ...remaining] = prev;
            return remaining;
        });

    }, [turn, gameId, isBlack, sendMessage, setBoardCol]);


    useEffect(() => {

        if (isWin || isDraw || isDefeat) return;

        const interval = setInterval(() => {
            if (turn) {
                setMyTime((prev) => Math.max(prev - 1000, 0));
            } else {
                setOpponentTime((prev) => Math.max(prev - 1000, 0));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [turn, isWin, isDraw, isDefeat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [movesHistory]);

    useEffect(() => {
        localStorage.setItem("boardPosition", JSON.stringify(boardPosition));
    }, [boardPosition]);

    useEffect(() => {
        if (
            socketRef.current &&
            (socketRef.current.readyState === WebSocket.OPEN ||
                socketRef.current.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        const baseURL = process.env.REACT_APP_BACKEND_URL

        socketRef.current = connectWebSocket(
            baseURL + `/api/games/${id}/reconnect?token=${token}`,
            (msg) => {
                try {
                    const data = JSON.parse(msg);

                    let isBlackColor = (data.color === 'black')

                    if (data.type === "reconnect_game") {
                        let currentBoard = fenToBoard(data.board, isBlackColor)
                        if (isBlackColor) {
                            currentBoard = rotateMatrix180(currentBoard)
                        }
                        setEnpassantSquare(data.enpassant_square)

                        setTurn(false)
                        if (data.turn === 2 && isBlackColor) {
                            setTurn(true)
                        }
                        if (data.turn === 1 && !isBlackColor) {
                            setTurn(true)
                        }
                        setBoard(currentBoard)
                    }

                } catch (e) {
                    console.error("Invalid message:", msg);
                }
            },
            () => { },
            () => { },
            (err) => console.error("WS error", err)
        );

        return () => {
            if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
            ) {
                socketRef.current.close();
            }

            socketRef.current = null;
        };
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

                    if (isDraw && (piece?.name === "bk" || piece?.name === "wk")) {
                        color = (row + col) % 2 === 0 ? lightBlue : darkBlue

                    }

                    if (isWin) {
                        if (isBlack) {
                            if (piece?.name === "bk") {
                                color = (row + col) % 2 === 0 ? lightGreen : darkGreen

                            }

                            if (piece?.name === "wk") {
                                color = (row + col) % 2 === 0 ? lightRed : darkRed

                            }
                        } else {
                            if (piece?.name === "wk") {
                                color = (row + col) % 2 === 0 ? lightGreen : darkGreen

                            }

                            if (piece?.name === "bk") {
                                color = (row + col) % 2 === 0 ? lightRed : darkRed

                            }
                        }
                    }

                    if (isDefeat) {

                        if (isBlack) {
                            if (piece?.name === "bk") {
                                color = (row + col) % 2 === 0 ? lightRed : darkRed

                            }

                            if (piece?.name === "wk") {
                                color = (row + col) % 2 === 0 ? lightGreen : darkGreen

                            }
                        } else {
                            if (piece?.name === "wk") {
                                color = (row + col) % 2 === 0 ? lightRed : darkRed

                            }

                            if (piece?.name === "bk") {
                                color = (row + col) % 2 === 0 ? lightGreen : darkGreen

                            }
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
            lines.forEach(({ start, end }) => drawArrow(ctx, start, end, "orange", cellSize / 4, cellSize));

            if (isRightDragging && startPos && mousePos) {
                drawArrow(
                    ctx,
                    [
                        Math.floor(startPos.y / cellSize),
                        Math.floor(startPos.x / cellSize),
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
            startPos,
            isRightDragging,
            lines,
            boardCol,
            previousMove,
            board,
            isWin,
            isDefeat,
            isDraw
        ]
    );

    const drawPromotionBoard = useCallback(
        (ctx) => {
            if (!ctx) return;

            for (let col = 0; col < 4; col++) {
                let color = col % 2 === 0 ? lightColor : darkColor;
                ctx.fillStyle = color;
                ctx.fillRect(col * cellSize, 0, cellSize, cellSize);
            }

            const pieces = ["q", "r", "b", "n"];
            const prefix = isBlack ? "b" : "w";

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
        },
        [cellSize, images, isBlack, lightColor, darkColor, imageScale, isPawnPromotion]
    );

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
                if (piece.isPlayable) {
                    newMoves = getWPawnMoves(row, col, board, enpassantSquare);
                } else {
                    newMoves = getBPawnMoves(row, col, board, enpassantSquare);
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
    }, [
        getKingMoves,
        getKingThreatMoves,
        getPinMoves,
        canKingSideCastle,
        canLongCastle,
        enpassantSquare
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
                newMoves = getKingPreMoves(row, col, board);
                break;
            case "wk":
                newMoves = getKingPreMoves(row, col, board);
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
    }, [board])

    const play = useCallback((row, col, newRow, newCol, currentPiece) => {
        let isValid = false
        if (moves.some(([r, c]) => r === newRow && c === newCol)) {
            isValid = true
            if (newCol !== col || newRow !== row) {
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (board[row][col] !== null) {
                            setBoard(prev => {
                                const newBoard = structuredClone(prev);
                                newBoard[row][col].isEnpassant = false;
                                return newBoard;
                            });
                        }
                    }
                }
            }

            setBoard(prev => {
                const newBoard = structuredClone(prev);
                newBoard[row][col] = null;
                return newBoard;
            });

            currentPiece.isMoved = true;
            if (currentPiece.name[1] === 'k') {
                const dc = newCol - col;
                if (Math.abs(dc) === 2) {
                    const isKingside = dc > 0;

                    const rookFromCol = isKingside ? 7 : 0;
                    const rookToCol = isKingside ? newCol - 1 : newCol + 1;

                    setBoard(prev => {
                        const newBoard = structuredClone(prev);
                        newBoard[row][rookToCol] = newBoard[row][rookFromCol];
                        newBoard[row][rookFromCol] = null;
                        return newBoard;
                    });

                    if (board[row][rookToCol]) {
                        setBoard(prev => {
                            const newBoard = structuredClone(prev);
                            newBoard[row][rookToCol].isMoved = true;
                            return newBoard;
                        });
                    }
                }
            }

            if (currentPiece.name === "wp" || currentPiece.name === "bp") {
                if (col !== newCol) {
                    if (board[newRow][newCol] === null) {
                        setBoard(prev => {
                            const newBoard = structuredClone(prev);
                            newBoard[row][newCol] = null
                            return newBoard;
                        });

                    }
                }
                if (Math.abs(row - newRow) === 2) {
                    currentPiece.isEnpassant = true
                }
            }

            setBoard(prev => {
                const newBoard = structuredClone(prev);
                newBoard[newRow][newCol] = currentPiece;
                return newBoard;
            });


            if (currentPiece) {
                let oldPos = coordinatesToNotation(row, col, isBlack)
                let newPos = coordinatesToNotation(newRow, newCol, isBlack)

                if (newRow === 0 && currentPiece.name[1] === 'p') {
                    setPreviousMove([[row, col], [newRow, newCol]]);

                    setIsPawnPromotion(true)

                } else {
                    sendMessage({
                        "game_id": gameId,
                        "type": "move",
                        "color": currentPiece.name[0],
                        "data": {
                            "from": oldPos,
                            "to": newPos,
                        }
                    })
                    setTurn(!turn)
                }

            }

            setCurrentPiece(null)
            setMoves([]);
        }
        return isValid
    }, [
        boardPosition,
        getKingThreatMoves,
        getNumberOfChecks,
        getPinMoves,
        isBlack,
        moves,
        turn
    ])

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");
        drawBoard(ctx);

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
            const pos = getMousePos(e);
            const col = Math.floor(pos.x / cellSize);
            const row = Math.floor(pos.y / cellSize);
            const piece = board[row][col];
            if (e.button === 2) {
                e.preventDefault();
                setPreviousRightClickCords([row, col])
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
                if (previousRightClickCords.length > 0 && previousRightClickCords[0] === newRow && previousRightClickCords[1] === newCol) {
                    highlightBoard[newRow][newCol] = true
                    setPreviousRightClickCords([])
                }
                setIsRightDragging(false);
                let sPos = startPos

                if (sPos) {
                    const sCol = Math.floor(sPos.x / cellSize);
                    const sRow = Math.floor(sPos.y / cellSize);

                    if (sCol === newCol && sRow === newRow) {

                        setBoard(orgBoard)
                        setBoardCol(Array.from({ length: 16 }, () => Array(16).fill(0)));
                        setPreMoves([])

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
        isBlack,
        isCheckMate,
        setIsCheckMate,
        boardPosition,
        isRightDragging,
        mousePos,
        startPos,
        preMoves,
        setPreMoves,
        boardCol,
        getKingThreatMoves,
        getNumberOfChecks,
        getPieceMoves,
        getPiecePreMoves,
        getPinMoves,
        play,
        orgBoard
    ]);

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
                            if (isBlack) {
                                queen = "q"
                            }

                            setPromotionPiece(queen)
                            break;
                        case 1:
                            let rook = "R"
                            if (isBlack) {
                                rook = "r"
                            }

                            setPromotionPiece(rook)
                            break;
                        case 2:
                            let bishop = "B"

                            if (isBlack) {
                                bishop = "b"
                            }

                            setPromotionPiece(bishop)
                            break;
                        case 3:

                            let knight = "N"

                            if (isBlack) {
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

    function handleMove(newRow, newCol, piece) {
        if (piece.piece.isPlayable !== turn) {
            if (moves.some(([r, c]) => r === newRow && c === newCol)) {

                setPreviousPreMove([[piece.row, piece.col], [newRow, newCol]])
                setBoardCol(prev => {
                    const newBoard = structuredClone(prev);
                    newBoard[newRow][newCol]++
                    return newBoard
                })

                if (newRow === 0 && piece.piece.name[1] === 'p') {

                    setIsPawnPromotion(true)

                } else {
                    let currentPiece = structuredClone(board[piece.row][piece.col]);
                    currentPiece.isMoved = true
                    setPreMoves([...preMoves, {
                        from: [piece.row, piece.col],
                        to: [newRow, newCol],
                    }]);
                    if (currentPiece.name[1] === 'k' && Math.abs(newCol - piece.col) > 1) {
                        if (newCol < piece.col) {
                            let rook = board[7][0]

                            setBoard(prev => {
                                const newBoard = structuredClone(prev);
                                newBoard[7][0] = null
                                newBoard[piece.row][piece.col] = null
                                newBoard[7][newCol] = currentPiece
                                newBoard[7][newCol + 1] = rook
                                return newBoard;
                            });

                            setBoardCol(prev => {
                                const newBoard = structuredClone(prev);
                                newBoard[7][newCol]++
                                newBoard[7][newCol + 1]++
                                return newBoard
                            })

                        } else {
                            let rook = board[7][7]

                            setBoard(prev => {
                                const newBoard = structuredClone(prev);
                                newBoard[7][7] = null
                                newBoard[piece.row][piece.col] = null
                                newBoard[7][newCol] = currentPiece
                                newBoard[7][newCol - 1] = rook
                                return newBoard;
                            });

                            setBoardCol(prev => {
                                const newBoard = structuredClone(prev);
                                newBoard[7][newCol]++
                                newBoard[7][newCol - 1]++
                                return newBoard
                            })
                        }
                    } else {
                        setBoard(prev => {
                            const newBoard = structuredClone(prev);
                            newBoard[piece.row][piece.col] = null;
                            return newBoard;
                        });
                        setBoardCol(prev => {
                            const newBoard = structuredClone(prev);
                            newBoard[newRow][newCol]++
                            return newBoard
                        })

                        setBoard(prev => {
                            const newBoard = structuredClone(prev);
                            newBoard[newRow][newCol] = currentPiece
                            return newBoard;
                        });

                    }
                    setMoves([]);
                }

            }
        } else {
            play(piece.row, piece.col, newRow, newCol, piece.piece)
        }
    }

    function offerDraw() {

        sendMessage({
            "game_id": gameId,
            "type": "draw",
        });

    }

    function resign() {
        sendMessage({
            "game_id": gameId,
            "type": "resign",
        });
    }

    function cancelDraw() {

        sendMessage({
            "game_id": gameId,
            "type": "cancel_draw",
        });

    }

    function OfferRematch() {

        sendMessage({
            "game_id": gameId,
            "type": "offer_rematch",
        });

    }

    function cancelRematchOffer() {

        sendMessage({
            "game_id": gameId,
            "type": "cancel_rematch",
        });

    }


    function newGame() {

        sendMessage({
            "game_id": gameId,
            "type": "new_game",
        });
    }


    function cancelNewGame() {
        sendMessage({
            "game_id": gameId,
            "type": "cancel_new_game",
        });
    }

    function handleResign() {
        setConfirmResign(true)
    }

    function rollbackDraw() {

        sendMessage({
            "game_id": gameId,
            "type": "decline_draw",
        });
    }


    function rollbackResign() {
        setConfirmResign(false)

    }


    function acceptDraw() {
        sendMessage({
            "game_id": gameId,
            "type": "accept_draw",
        });
    }

    function acceptRematch() {
        sendMessage({
            "game_id": gameId,
            "type": "accept_rematch",
        });
    }

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center bg-gray-900 mt-4 sm:mt-8 gap-4 lg:gap-6 p-3 sm:p-0 w-full">
            <div className="w-full max-w-[750px] lg:w-auto flex flex-col items-center">
                {isPawnPromotion && (
                    <canvas
                        ref={promotionCanvas}
                        width={cellSize * 4}
                        height={cellSize}
                        className="shadow-lg cursor-pointer mx-auto my-4 max-w-full h-auto"
                    />
                )}
                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className="rounded-lg shadow-lg cursor-pointer max-w-full h-auto"
                />
            </div>

            <div className="flex flex-col w-full lg:w-96">
                {(() => {
                    if (isGameOver) {

                        if (isDraw) {

                            return (<div className="text-white p-4">
                                Draw
                            </div>
                            )
                        } else {
                            return (
                                <div className="text-white p-4">
                                    {winner === "white" ? "White won!" : "Black won!"}
                                </div>
                            );
                        }

                    }

                })()}
                <div className="p-2 sm:p-4">
                    <div className="flex justify-between items-center text-white text-lg sm:text-xl">
                        <div className="flex flex-col">
                            <span>{opponentInfo?.username}</span>
                            <span className="text-sm text-gray-400">
                                {opponentInfo?.rating}
                                {isGameOver && (
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

                        <div className="flex items-center gap-2">
                            <span className={!turn ? "text-green-400 font-mono" : "text-gray-400 font-mono"}>
                                {formatTime(opponentTime)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto lg:mx-4 bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden">
                    <div className="bg-gray-700 text-white p-2 text-center font-semibold">
                        Moves
                    </div>

                    <div ref={scrollRef} className="h-56 sm:h-72 overflow-y-auto">
                        <div className="grid grid-cols-2 text-white">
                            <div className="bg-gray-700 border border-gray-600 text-center font-bold py-1">White</div>
                            <div className="bg-gray-700 border border-gray-600 text-center font-bold py-1">Black</div>

                            {movesHistory.map((move, index) => {
                                if (index % 2 === 0) {
                                    return (
                                        <Fragment key={index}>
                                            <div className="border border-gray-600 text-center py-1 text-sm sm:text-base">{move}</div>
                                            <div className="border border-gray-600 text-center py-1 text-sm sm:text-base">
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
                <div className="p-2 sm:p-4">
                    <div className="flex justify-between items-center text-white text-lg sm:text-xl">
                        <div className="flex flex-col">
                            <span>{playerInfo?.username}</span>
                            <span className="text-sm">
                                {playerInfo?.rating}
                                {isGameOver && (
                                    <span
                                        style={{
                                            color:
                                                myPointsDelta > 0
                                                    ? "green"
                                                    : myPointsDelta < 0
                                                        ? "red"
                                                        : undefined
                                        }}
                                    >
                                        {myPointsDelta > 0
                                            ? ` +${myPointsDelta}`
                                            : ` ${myPointsDelta}`}
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={turn ? "text-green-400 font-mono" : "text-gray-400 font-mono"}>
                                {formatTime(myTime)}
                            </span>
                        </div>
                    </div>
                </div>

                {(() => {

                    if (isGameOver) {

                        return (
                            <div className="flex flex-col">

                                {(() => {
                                    if (isRematchAvailable) {
                                        return (
                                            <div className="mb-4">
                                                <p className="text-white">
                                                    Your opponent is offering a rematch
                                                </p>
                                            </div>

                                        )
                                    }
                                })()}

                                <div className="mx-auto flex flex-wrap justify-center">

                                    <div className="mx-auto flex flex-wrap justify-center gap-3 sm:space-x-4">
                                        {(() => {
                                            if (!isRematchAvailable) {
                                                if (!isRematchOffered && !loadNewGame) {
                                                    return (
                                                        <div>
                                                            <button
                                                                className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                                style={{
                                                                    backgroundColor: 'oklch(48.8% 0.243 264.376)'
                                                                }}
                                                                onClick={OfferRematch}
                                                            >
                                                                Rematch
                                                            </button>
                                                        </div>
                                                    )
                                                } else {
                                                    if (isRematchOffered) {
                                                        return (
                                                            <button
                                                                className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                                style={{
                                                                    backgroundColor: 'oklch(58.6% 0.253 17.585)'
                                                                }}
                                                                onClick={cancelRematchOffer}
                                                            >
                                                                Sent Rematch
                                                            </button>)

                                                    }
                                                }
                                            } else {

                                                return (
                                                    <div>
                                                        <button
                                                            className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                            style={{
                                                                backgroundColor: 'oklch(64.6% 0.222 41.116)'
                                                            }}
                                                            onClick={acceptRematch}
                                                        >
                                                            Accept Rematch
                                                        </button>
                                                    </div>

                                                )

                                            }


                                        })()}

                                        {(() => {
                                            if (!loadNewGame && !isRematchOffered) {
                                                return (
                                                    <div>
                                                        <button
                                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                            style={{
                                                                backgroundColor: 'oklch(43.2% 0.095 166.913)'
                                                            }}
                                                            onClick={newGame}

                                                        >
                                                            New Game
                                                        </button>
                                                    </div>
                                                )
                                            } else {
                                                if (loadNewGame) {

                                                    return (
                                                        <button
                                                            onClick={cancelNewGame}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded disabled:opacity-50"
                                                            style={{
                                                                backgroundColor: 'oklch(58.6% 0.253 17.585)'
                                                            }}
                                                        >
                                                            {loading && (
                                                                <ClipLoader
                                                                    color="#ffffff"
                                                                    size={18}
                                                                    aria-label="Loading"
                                                                />
                                                            )}

                                                            Loading...
                                                        </button>

                                                    )
                                                }
                                            }


                                        })()}

                                    </div>
                                </div>
                            </div>
                        )
                    } else {
                        return (
                            <div className="mx-auto flex flex-wrap justify-center gap-3 sm:space-x-4">

                                {(() => {

                                    if (!confirmResign && !isDrawAvailable) {
                                        return (

                                            <button
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                style={{
                                                    backgroundColor: 'oklch(58.6% 0.253 17.585)'
                                                }}
                                                onClick={handleResign}
                                            >
                                                Resign
                                            </button>


                                        )
                                    }

                                })()}

                                {(() => {

                                    if (!cancelDrawOffer && !confirmResign && !isDrawAvailable) {
                                        return (

                                            <div className="mx-auto flex flex-wrap justify-center gap-3 sm:space-x-4">
                                                <button
                                                    className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                    style={{
                                                        backgroundColor: 'oklch(44.6% 0.043 257.281)'
                                                    }}
                                                    onClick={offerDraw}
                                                >
                                                    Offer Draw
                                                </button>


                                            </div>


                                        )
                                    }

                                })()}

                                {(() => {
                                    if (isDrawAvailable) {

                                        return (
                                            <div>
                                                <p className="text-white m-4">
                                                    Opponent offered draw
                                                </p>


                                                <div className="space-x-2 mx-auto">
                                                    <button
                                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                        style={{
                                                            backgroundColor: 'oklch(43.2% 0.095 166.913)'
                                                        }}
                                                        onClick={acceptDraw}
                                                    >
                                                        Accept
                                                    </button>

                                                    <button
                                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                        style={{
                                                            backgroundColor: 'oklch(58.6% 0.253 17.585)'
                                                        }}
                                                        onClick={rollbackDraw}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>


                                            </div>
                                        )

                                    } else {

                                        if (cancelDrawOffer) {

                                            return (
                                                <button
                                                    className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                    style={{
                                                        backgroundColor: 'oklch(55.3% 0.195 38.402)'
                                                    }}
                                                    onClick={cancelDraw}
                                                >
                                                    Cancel Draw Offer
                                                </button>
                                            )
                                        }

                                        if (confirmResign) {

                                            return (
                                                <div>
                                                    <p className="text-white m-4">
                                                        Are you sure you want to resign?
                                                    </p>


                                                    <div className="space-x-2 mx-auto">
                                                        <button
                                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                            style={{
                                                                backgroundColor: 'oklch(58.6% 0.253 17.585)'
                                                            }}
                                                            onClick={resign}
                                                        >
                                                            Yes
                                                        </button>

                                                        <button
                                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                            style={{
                                                                backgroundColor: 'oklch(27.8% 0.033 256.848)'
                                                            }}
                                                            onClick={rollbackResign}
                                                        >
                                                            No
                                                        </button>
                                                    </div>


                                                </div>
                                            )

                                        }
                                    }

                                })()}

                            </div>
                        )
                    }

                })()}

            </div>

        </div>
    );
}
