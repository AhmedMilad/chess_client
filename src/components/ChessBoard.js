import { useEffect, useRef, useState, useCallback } from "react";

const pieceImages = {
    wP: "/assets/pieces/wp.svg",
    wR: "/assets/pieces/wr.svg",
    wN: "/assets/pieces/wn.svg",
    wB: "/assets/pieces/wb.svg",
    wQ: "/assets/pieces/wq.svg",
    wK: "/assets/pieces/wk.svg",
    bP: "/assets/pieces/bp.svg",
    bR: "/assets/pieces/br.svg",
    bN: "/assets/pieces/bn.svg",
    bB: "/assets/pieces/bb.svg",
    bQ: "/assets/pieces/bq.svg",
    bK: "/assets/pieces/bk.svg",
};

const initialBoard = [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

export default function ChessBoard({ size = 500 }) {
    const canvasRef = useRef(null);
    const [board, setBoard] = useState(initialBoard);
    const [images, setImages] = useState({});
    const [dragging, setDragging] = useState(null);

    const rows = 8;
    const cols = 8;
    const cellSize = size / rows;
    const lightColor = "#f0d9b5";
    const darkColor = "#b58863";

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

            ctx.fillStyle = "#000000";
            ctx.font = `${cellSize / 5}px Arial`;
            ctx.textBaseline = "top";

            for (let i = 0; i < cols; i++) {
                const letter = String.fromCharCode(97 + i);
                ctx.fillText(letter, i * cellSize + 4, size - cellSize / 5 - 2);
            }

            for (let i = 0; i < rows; i++) {
                const number = 8 - i;
                ctx.fillText(String(number), 2, i * cellSize + 2);
            }

            const scale = 0.8;
            const offset = (1 - scale) / 2 * cellSize;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const piece = board[row][col];
                    if (piece && images[piece]) {
                        if (dragging && dragging.row === row && dragging.col === col) continue;
                        ctx.drawImage(
                            images[piece],
                            col * cellSize + offset,
                            row * cellSize + offset,
                            cellSize * scale,
                            cellSize * scale
                        );
                    }
                }
            }

            if (dragging) {
                ctx.drawImage(
                    images[dragging.piece],
                    dragging.x - dragging.offsetX,
                    dragging.y - dragging.offsetY,
                    cellSize * scale,
                    cellSize * scale
                );
            }
        },
        [board, dragging, images, size, cellSize, lightColor, darkColor]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || Object.keys(images).length === 0) return;
        const ctx = canvas.getContext("2d");
        drawBoard(ctx);

        const handleMouseDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);
            const piece = board[row][col];

            if (piece) {
                setDragging({
                    piece,
                    row,
                    col,
                    x,
                    y,
                    offsetX: x - col * cellSize,
                    offsetY: y - row * cellSize,
                });
            }
        };

        const handleMouseMove = (e) => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setDragging((d) => ({ ...d, x, y }));
            drawBoard(ctx);
        };

        const handleMouseUp = (e) => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / cellSize);
            const row = Math.floor(y / cellSize);

            const file = String.fromCharCode(97 + col);
            const rank = 8 - row;
            console.log(`Dropped on: ${file}${rank}`);

            const newBoard = board.map((r) => [...r]);
            newBoard[dragging.row][dragging.col] = "";
            newBoard[row][col] = dragging.piece;
            setBoard(newBoard);
            setDragging(null);
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
    }, [board, dragging, images, drawBoard, cellSize]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-lg shadow-lg cursor-pointer"
        />
    );
}
