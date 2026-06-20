
export const pieceImages = {
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

export class Piece {
    constructor(name, image, weight) {
        this.name = name;
        this.image = image;
        this.weight = weight;
        this.isEnpassant = false;
        this.isMoved = false; // this needs to be removed
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

export const rotateMatrix180 = source => {
    const M = source.length;
    const N = source[0].length;
    let destination = new Array(M);
    for (let i = 0; i < M; i++) {
        destination[i] = new Array(N);
        for (let j = 0; j < N; j++) {
            destination[i][j] = source[M - i - 1][N - j - 1];
        }
    }
    return destination;
};

export const getBoard = (isBlack) => {
    let currentBoard = board
    if (isBlack) {
        currentBoard = rotateMatrix180(board)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                let piece = board[row][col]
                if (piece != null && piece.name[0] === 'b') {
                    piece.isPlayable = true;
                }
            }
        }
    } else {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                let piece = board[row][col]
                if (piece != null && piece.name[0] === 'w') {
                    piece.isPlayable = true;
                }
            }
        }
    }
    return currentBoard
};

export function getPawnCheck(row, col, board) {
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

export function getWPawnMoves(row, col, board, enpassantSquare) {
    let [r, c] = squareToIndex(enpassantSquare)

    let newMoves = [];
    let pawn = board[row][col]

    if (pawn != null && pawn.name[0] === 'b') {
        c = 7 - c
    } else {
        r = 7 - r
    }

    if (row > 0 && board[row - 1][col] === null) {
        newMoves.push([row - 1, col]);
        if (pawn != null && row === 6 && row - 2 >= 0 && board[row - 2][col] === null) newMoves.push([row - 2, col]);
    }
    if (col > 0) {
        if (enpassantSquare != null && enpassantSquare !== "") {
            if (r === row && c === (col - 1)) {
                newMoves.push([row - 1, col - 1]);
            }
        }
        if (row > 0 && board[row - 1][col - 1] !== null && pawn !== null && board[row - 1][col - 1].name[0] !== pawn.name[0]) {
            newMoves.push([row - 1, col - 1]);
        }
    }
    if (col < 7) {
        if (enpassantSquare != null && enpassantSquare !== "") {
            if (r === row && c === (col + 1)) {
                newMoves.push([row - 1, col + 1]);
            }
        }
        if (row > 0 && board[row - 1][col + 1] !== null && pawn !== null && board[row - 1][col + 1].name[0] !== pawn.name[0]) {
            newMoves.push([row - 1, col + 1]);
        }
    }
    return newMoves;
}

export function getBPawnMoves(row, col, board, enpassantSquare) {
    let [r, c] = squareToIndex(enpassantSquare);

    let newMoves = [];
    let pawn = board[row][col];

    if (pawn != null && pawn.name[0] === 'w') {
        c = 7 - c;
    } else {
        r = 7 - r;
    }

    if (row < 7 && board[row + 1][col] === null) {
        newMoves.push([row + 1, col]);

        if (
            pawn != null &&
            row === 1 &&
            row + 2 <= 7 &&
            board[row + 2][col] === null
        ) {
            newMoves.push([row + 2, col]);
        }
    }

    if (col > 0) {
        if (enpassantSquare != null && enpassantSquare !== "") {
            if (r === row && c === (col - 1)) {
                newMoves.push([row + 1, col - 1]);
            }
        }

        if (
            row < 7 &&
            board[row + 1][col - 1] !== null &&
            pawn !== null &&
            board[row + 1][col - 1].name[0] !== pawn.name[0]
        ) {
            newMoves.push([row + 1, col - 1]);
        }
    }

    if (col < 7) {
        if (enpassantSquare != null && enpassantSquare !== "") {
            if (r === row && c === (col + 1)) {
                newMoves.push([row + 1, col + 1]);
            }
        }

        if (
            row < 7 &&
            board[row + 1][col + 1] !== null &&
            pawn !== null &&
            board[row + 1][col + 1].name[0] !== pawn.name[0]
        ) {
            newMoves.push([row + 1, col + 1]);
        }
    }

    return newMoves;
}

export function getKnightMoves(row, col, board, target) {
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

export function isSafeSquare(row, col, board, target, isPlayable) {
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

export const getKingMoves = (row, col, board, target, canKingSideCastle, canLongCastle) => {
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
    let newCol = col
    let exists = newMoves.some(move =>
        move[0] === row && move[1] === col - 1
    );

    let friendCol = (target === 'w') ? 'b' : 'w'

    if (exists) {
        while (newCol > 0) {
            newCol--
            let piece = board[row][newCol]
            if (piece != null) {
                if (piece.name[0] === king.name[0] && piece.name[1] === 'r' && ((friendCol === 'b' && canKingSideCastle) || (friendCol === 'w' && canLongCastle))) {

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
                if (piece.name[0] === king.name[0] && piece.name[1] === 'r' && ((friendCol === 'b' && canLongCastle) || (friendCol === 'w' && canKingSideCastle))) {
                    if (isSafeSquare(row, col + 2, board, target, piece.isPlayable)) {
                        newMoves.push([row, col + 2]);
                    }
                }
                break
            }
        }
    }
    return newMoves;
}

export function getVerticalMoves(row, col, board, target) {
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

export function getHorizontalMoves(row, col, board, target) {
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

export function getMainDiagonal(row, col, board, target) {
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

export function getAntiDiagonal(row, col, board, target) {
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

export function getHorizontalThreat(row, col, board, targets = []) {
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

export function getVerticalThreat(row, col, board, targets = []) {
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

export function getPawnThreat(row, col, board, target) {
    let directions = [
        [1, -1], [1, 1]
    ];
    let pawn = board[row][col]
    if (pawn && pawn.isPlayable) {
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

export function getMainDiagonalThreat(row, col, board, targets = []) {
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

export function getAntiDiagonalThreat(row, col, board, targets = []) {
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

export const getKingThreatMoves = (target, board) => {
    let kingRow = 0;
    let kingCol = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
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

export function getKnightThreatMoves(row, col, board, target) {
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

export const getPinMoves = (row, col, board) => {
    let pinMoves = getMainDiagonalPinMoves(row, col, board)
        .concat(getAntiDiagonalPinMoves(row, col, board))
        .concat(getHorizontalPinMoves(row, col, board))
        .concat(getVerticalPinMoves(row, col, board))
    return pinMoves
}

export function getMainDiagonalPinMoves(row, col, board) {
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

export function getAntiDiagonalPinMoves(row, col, board) {
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

export function getVerticalPinMoves(row, col, board) {
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

export function getHorizontalPinMoves(row, col, board) {
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

export const getNumberOfChecks = (board, target) => {
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

export function getMainDiagonalCheck(row, col, board) {
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

export function getAntiDiagonalCheck(row, col, board) {
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

export function getVerticalCheck(row, col, board) {
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

export function getHorizontalCheck(row, col, board) {
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

export function getMainDiagonalPreMoves(row, col) {
    let newCol = col, newRow = row
    let newMoves = []
    while (newCol > 0 && newRow > 0) {
        newCol--
        newRow--
        newMoves.push([newRow, newCol])
    }
    newCol = col
    newRow = row
    while (newCol < 7 && newRow < 7) {
        newCol++
        newRow++
        newMoves.push([newRow, newCol])
    }
    return newMoves
}

export function getAntiDiagonalPreMoves(row, col) {
    let newCol = col, newRow = row
    let newMoves = []
    while (newCol > 0 && newRow < 7) {
        newCol--
        newRow++
        newMoves.push([newRow, newCol])
    }
    newCol = col
    newRow = row
    while (newCol < 7 && newRow > 0) {
        newCol++
        newRow--
        newMoves.push([newRow, newCol])
    }
    return newMoves
}

export function getVerticalPreMoves(row, col) {
    let newRow = row
    let newMoves = []
    while (newRow < 7) {
        newRow++
        newMoves.push([newRow, col])
    }
    newRow = row
    while (newRow > 0) {
        newRow--
        newMoves.push([newRow, col])
    }
    return newMoves
}

export function getHorizontalPreMoves(row, col) {
    let newCol = col
    let newMoves = []
    while (newCol < 7) {
        newCol++
        newMoves.push([row, newCol])
    }
    newCol = col
    while (newCol > 0) {
        newCol--
        newMoves.push([row, newCol])
    }
    return newMoves
}

export function getWPawnPreMoves(row, col) {
    let newMoves = [];
    newMoves.push([row - 1, col]);
    if (row === 6) {
        newMoves.push([row - 2, col]);
    }
    if (col > 0) {
        newMoves.push([row - 1, col - 1]);
    }
    if (col < 7) {
        newMoves.push([row - 1, col + 1]);
    }
    return newMoves;
}

export function getBPawnPreMoves(row, col) {
    let newMoves = [];
    newMoves.push([row + 1, col]);
    if (row === 1) {
        newMoves.push([row + 2, col]);
    }
    if (col > 0) {
        newMoves.push([row + 1, col - 1]);
    }
    if (col < 7) {
        newMoves.push([row + 1, col + 1]);
    }
    return newMoves;
}

export function getKnightPreMoves(row, col) {
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
            newMoves.push([newRow, newCol]);
        }
    }

    return newMoves;
}

export function getKingPreMoves(row, col, preMovesBoard) {
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
            newMoves.push([newRow, newCol]);
        }
    }

    let king = preMovesBoard[row][col]
    if (!king.isMoved) {
        let rook = king.name[0] + 'r'
        let op = (king.name[0] === 'w') ? 'b' : 'w';
        for (let i = col - 1; i >= 0; i--) {
            let piece = preMovesBoard[row][i]
            if (piece != null) {
                if (piece.name === rook && !piece.isMoved) {
                    if (isSafeSquare(row, col - 2, preMovesBoard, op, piece.isPlayable)) {
                        newMoves.push([row, col - 2]);
                    }
                }
                break;
            }
        }

        for (let i = col + 1; i < 8; i++) {
            let piece = preMovesBoard[row][i]
            if (piece != null) {
                if (piece.name === rook && !piece.isMoved) {
                    if (isSafeSquare(row, col + 2, preMovesBoard, op, piece.isPlayable)) {
                        newMoves.push([row, col + 2]);
                    }
                }
                break;
            }
        }
    }
    return newMoves;
}

export function getKnightCheck(row, col, board) {
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

export function getFenFromBoard(board, turn = "w", isOriginalPerspective) {

    if (!isOriginalPerspective) {
        board = board.toReversed().map(row => row.toReversed())
    }

    let fenRows = [];

    for (let row = 0; row < 8; row++) {
        let empty = 0;
        let fenRow = "";

        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece) {
                empty++;
            } else {
                if (empty > 0) {
                    fenRow += empty;
                    empty = 0;
                }
                const color = piece.name[0];
                const type = piece.name[1];
                fenRow += color === "w" ? type.toUpperCase() : type.toLowerCase();
            }
        }

        if (empty > 0) fenRow += empty;
        fenRows.push(fenRow);
    }
    let fen = fenRows.join("/") + ` ${turn} - - 0 1`;
    return fen;
}

export function notationToIndex(square, isBlack = false) {
    const move = square.toLowerCase().replace(/0/g, "o");
    if (move === "o-o" || move === "oo") {
        return isBlack ? [[0, 3], [0, 1]] : [[0, 4], [0, 6]]
    }

    if (move === "o-o-o" || move === "ooo") {
        return isBlack ? [[0, 3], [0, 5]] : [[0, 4], [0, 2]]
    }

    const match = move.match(/([a-h][1-8])$/i);
    if (!match) {
        throw new Error("Invalid square notation: " + square);
    }
    const pureSquare = match[1].toLowerCase();
    const file = pureSquare[0];
    const rank = Number(pureSquare[1]);
    let col = file.charCodeAt(0) - "a".charCodeAt(0);
    let row = 8 - rank;
    if (isBlack) {
        row = 7 - row;
        col = 7 - col;
    }

    return [row, col];
}

export function fenToBoard(fen, isBlack) {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));

    const rows = fen.split(" ")[0].split("/");
    const fenToPiece = {
        r: "r",
        n: "n",
        b: "b",
        q: "q",
        k: "k",
        p: "p",
    };
    const pieceValues = {
        r: 5,
        n: 3,
        b: 3,
        q: 9,
        k: 100,
        p: 1,
    };


    for (let row = 0; row < 8; row++) {
        let col = 0;

        for (const char of rows[row]) {
            if (!isNaN(char)) {
                col += Number(char);
            } else {
                const isWhite = char === char.toUpperCase();
                const color = isWhite ? "w" : "b";
                const type = fenToPiece[char.toLowerCase()];

                const code = color + type;

                board[row][col] = new Piece(
                    code,
                    pieceImages[code],
                    pieceValues[type]
                );

                if (isBlack && color === 'b') {
                    board[row][col].isPlayable = true;
                } else if (!isBlack && color === 'w') {
                    board[row][col].isPlayable = true;
                }

                col++;
            }
        }
    }
    return board;
}

export function fenToAnalysisBoard(fen) {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));

    const rows = fen.split(" ")[0].split("/");
    const fenToPiece = {
        r: "r",
        n: "n",
        b: "b",
        q: "q",
        k: "k",
        p: "p",
    };
    const pieceValues = {
        r: 5,
        n: 3,
        b: 3,
        q: 9,
        k: 100,
        p: 1,
    };


    for (let row = 0; row < 8; row++) {
        let col = 0;

        for (const char of rows[row]) {
            if (!isNaN(char)) {
                col += Number(char);
            } else {
                const isWhite = char === char.toUpperCase();
                const color = isWhite ? "w" : "b";
                const type = fenToPiece[char.toLowerCase()];

                const code = color + type;

                board[row][col] = new Piece(
                    code,
                    pieceImages[code],
                    pieceValues[type]
                );

                board[row][col].isPlayable = true;

                col++;
            }
        }
    }
    return board;
}

export function squareToIndex(square) {
    if (square == null || square.length !== 2) {
        return []
    }

    let col = square[0].charCodeAt(0) - 97
    let row = parseInt(square[1], 10) - 1

    return [row, col]
}

export function coordinatesToNotation(row, col, isBlack = false) {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
        throw new Error("Coordinates must be between 0 and 7");
    }

    let targetRow = row;
    let targetCol = col;

    if (isBlack) {
        targetRow = 7 - row;
        targetCol = 7 - col;
    }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileNotation = files[targetCol];

    const rankNotation = 8 - targetRow;

    return `${fileNotation}${rankNotation}`;
}

export function getMoveNotation(fromRow, fromCol, toRow, toCol, isKingSideCastle, isLongCastle, isOriginalPerspective, enpassantSquare, promoteTo, turn, board) {

    let piece = board[fromRow][fromCol]
    let notation = ""

    if (!piece) {

        return ""
    }

    let name = piece.name[1]

    switch (name) {
        case "n":

            notation = getKnightMoveNotation(fromRow, fromCol, toRow, toCol, isOriginalPerspective, board)
            break;
        case "k":
            notation = getKingMoveNotation(fromRow, fromCol, toRow, toCol, isKingSideCastle, isLongCastle, isOriginalPerspective, board)

            break;
        case "b":
            notation = getBishopMoveNotation(fromRow, fromCol, toRow, toCol, isOriginalPerspective, board)

            break;
        case "r":
            notation = getRookMoveNotation(fromRow, fromCol, toRow, toCol, isOriginalPerspective, board)

            break;

        case "q":
            notation = getQueenMoveNotation(fromRow, fromCol, toRow, toCol, isOriginalPerspective, board)

            break;

        case "p":

            notation = getPawnMoveNotation(fromRow, fromCol, toRow, toCol, enpassantSquare, promoteTo, isOriginalPerspective, turn, board)

            break;

        default:
            return notation
    }


    return notation
}

function getKnightMoveNotation(fromX, fromY, toX, toY, isOriginalPerspective, board) {
    const knight = board[fromX][fromY]?.name[1];

    if (knight.toLowerCase() !== "n") {
        return ""
    }

    let notation = "N";

    let originNote = coordinatesToNotation(fromX, fromY, !isOriginalPerspective);
    let destNote = coordinatesToNotation(toX, toY, !isOriginalPerspective);

    if (board[toX][toY] !== null) {
        destNote = "x" + destNote;
    }

    const ranks = {};
    const files = {};

    const allMoves = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
    ];

    let found = 0;

    for (const move of allMoves) {
        const dx = move[0] + toX;
        const dy = move[1] + toY;

        if (Math.max(dx, dy) > 7 || Math.min(dx, dy) < 0) {
            continue;
        }

        if (board[dx][dy]?.name[1] === knight) {
            files[dx] = (files[dx] || 0) + 1;
            ranks[dy] = (ranks[dy] || 0) + 1;
            found++;
        }
    }

    if (found > 1 || (ranks[fromY] || 0) > 1) {
        notation += originNote[0];
    }

    if ((files[fromX] || 0) > 1) {
        notation += originNote[1];
    }

    return notation + destNote;
}

function getKingMoveNotation(fromX, fromY, toX, toY, isKingSideCastle, isLongCastle, isOriginalPerspective, board) {
    const king = board[fromX][fromY]?.name[1];

    if (king.toLowerCase() !== "k") {
        return ""
    }

    if (isKingSideCastle) {
        return "O-O";
    }

    if (isLongCastle) {
        return "O-O-O";
    }

    let notation = "K";

    // is capture
    if (board[toX][toY] !== null) {
        notation += "x";
    }

    notation += coordinatesToNotation(toX, toY, !isOriginalPerspective);

    return notation;
}

function getBishopMoveNotation(fromX, fromY, toX, toY, isOriginalPerspective, board) {
    const bishop = board[fromX][fromY]?.name[1];

    if (bishop.toLowerCase() !== "b") {
        return ""
    }

    let notation = "B";
    let originNote = coordinatesToNotation(fromX, fromY, !isOriginalPerspective);
    let destNote = coordinatesToNotation(toX, toY, !isOriginalPerspective);

    let found = 0

    if (board[toX][toY] !== null) {
        destNote = "x" + destNote;
    }

    const ranks = {};
    const files = {};

    for (let i = 1; i < 8; i++) {
        const dx = toX + i;
        const dy = toY + i;

        if (dx > 7 || dy > 7) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === bishop) {
                files[dx] = (files[dx] || 0) + 1;
                ranks[dy] = (ranks[dy] || 0) + 1;
                found++
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX - i;
        const dy = toY - i;

        if (dx < 0 || dy < 0) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === bishop) {
                files[dx] = (files[dx] || 0) + 1;
                ranks[dy] = (ranks[dy] || 0) + 1;
                found++
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX + i;
        const dy = toY - i;

        if (dx > 7 || dy < 0) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === bishop) {
                files[dx] = (files[dx] || 0) + 1;
                ranks[dy] = (ranks[dy] || 0) + 1;
                found++
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX - i;
        const dy = toY + i;

        if (dx < 0 || dy > 7) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === bishop) {
                files[dx] = (files[dx] || 0) + 1;
                ranks[dy] = (ranks[dy] || 0) + 1;
                found++
            }

            break;
        }
    }

    if (found > 1 || (files[fromX] || 0) > 1) {
        notation += originNote[0];
    }

    if ((ranks[fromY] || 0) > 1) {
        notation += originNote[1];
    }

    return notation + destNote;
}

function getRookMoveNotation(fromX, fromY, toX, toY, isOriginalPerspective, board) {
    const rook = board[fromX][fromY]?.name[1];

    if (typeof rook === "string" && rook.toLowerCase() !== "r") {
        return ""
    }

    let notation = "R";
    let originNote = coordinatesToNotation(fromX, fromY, !isOriginalPerspective);
    let destNote = coordinatesToNotation(toX, toY, !isOriginalPerspective);

    if (board[toX][toY] !== null) {
        destNote = "x" + destNote;
    }

    const ranks = {};
    const files = {};

    let found = 0

    for (let i = 1; i < 8; i++) {
        const dx = toX + i;

        if (dx > 7) {
            break;
        }

        const piece = board[dx][toY]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === rook) {
                ranks[fromY] = (ranks[fromY] || 0) + 1;
                found++
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX - i;

        if (dx < 0) {
            break;
        }

        const piece = board[dx][toY]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === rook) {
                ranks[fromY] = (ranks[fromY] || 0) + 1;
                found++
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dy = toY + i;

        if (dy > 7) {
            break;
        }

        const piece = board[toX][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === rook) {
                files[fromX] = (files[fromX] || 0) + 1;
                found++
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dy = toY - i;

        if (dy < 0) {
            break;
        }

        const piece = board[toX][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === rook) {
                files[fromX] = (files[fromX] || 0) + 1;
                found++
            }

            break;
        }
    }

    if (found > 1 || (files[fromX] || 0) > 1) {
        notation += originNote[0];
    }

    if ((ranks[fromY] || 0) > 1) {
        notation += originNote[1];
    }

    return notation + destNote;
}

function getQueenMoveNotation(fromX, fromY, toX, toY, isOriginalPerspective, board) {
    const queen = board[fromX][fromY]?.name[1];

    if (typeof queen === "string" && queen.toLowerCase() !== "q") {
        return ""
    }

    let notation = "Q";

    let pos = [];
    let originNote = coordinatesToNotation(fromX, fromY, !isOriginalPerspective);

    let destNote = coordinatesToNotation(toX, toY, !isOriginalPerspective);

    if (board[toX][toY] !== null) {
        destNote = "x" + destNote;
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX + i;

        if (dx > 7) {
            break;
        }

        const piece = board[dx][toY]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([dx, toY]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX - i;

        if (dx < 0) {
            break;
        }

        const piece = board[dx][toY]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([dx, toY]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dy = toY + i;

        if (dy > 7) {
            break;
        }

        const piece = board[toX][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([toX, dy]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dy = toY - i;

        if (dy < 0) {
            break;
        }

        const piece = board[toX][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([toX, dy]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX + i;
        const dy = toY + i;

        if (dx > 7 || dy > 7) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([dx, dy]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX - i;
        const dy = toY - i;

        if (dx < 0 || dy < 0) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([dx, dy]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX + i;
        const dy = toY - i;

        if (dx > 7 || dy < 0) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([dx, dy]);
            }

            break;
        }
    }

    for (let i = 1; i < 8; i++) {
        const dx = toX - i;
        const dy = toY + i;

        if (dx < 0 || dy > 7) {
            break;
        }

        const piece = board[dx][dy]?.name[1];

        if (piece !== null && piece !== undefined) {
            if (piece === queen) {
                pos.push([dx, dy]);
            }

            break;
        }
    }

    let isSameFile = false;
    let isSameRank = false;
    let isOnDiagonal = false;

    for (const p of pos) {
        if (p[0] === fromX && p[1] === fromY) {
            continue;
        }

        if (p[0] === fromX) {
            isSameRank = true;
        }

        if (p[1] === fromY) {
            isSameFile = true;
        }

        if (p[0] !== fromX && p[1] !== fromY) {

            isOnDiagonal = true;
        }
    }

    if (isSameRank || isOnDiagonal) {

        notation += originNote[0];
    }

    if (isSameFile) {
        notation += originNote[1];
    }

    return notation + destNote;
}

function getPawnMoveNotation(fromX, fromY, toX, toY, enpassantSquare, promoteTo, isOriginalPerspective, turn, board) {

    const piece = board[fromX][fromY]?.name[1];

    if (piece.toLowerCase() !== "p") {
        return ""
    }

    let notation = "";

    let dir = -1;

    if ((isOriginalPerspective && turn === "white") || (!isOriginalPerspective && turn === "black")) {

        dir = 1;
    }

    let cnt = 0;

    if (fromX !== toX) {
        if (toX + 1 <= 7) {
            if (board[toX + 1][dir + toY] === piece) {
                cnt++;
            }
        }

        if (toX - 1 >= 0) {
            if (board[toX - 1][dir + toY] === piece) {
                cnt++;
            }
        }
    }

    // if found two pawns hitting the same target square
    if (cnt === 2) {
        let originNote = coordinatesToNotation(fromX, fromY, !isOriginalPerspective);

        notation += originNote[0];
    }

    if (board[toX][toY] !== null) {
        notation += "x";
    }

    if (typeof enpassantSquare === 'string' && enpassantSquare.trim() !== "") {
        let coordinates = notationToIndex(enpassantSquare, !isOriginalPerspective);

        if (toY === coordinates[1] && toX === coordinates[0] + dir * -1) {
            notation += "x";
        }
    }

    let destNote = coordinatesToNotation(toX, toY, !isOriginalPerspective);

    notation += destNote;

    console.log(promoteTo)
    
    if (promoteTo.trim() !== "") {
        notation += "=" + promoteTo.toUpperCase();
    }
    
    return notation;
}