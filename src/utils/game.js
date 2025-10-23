
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

const rotateMatrix180 = source => {
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
    if (isBlack) {
        board = rotateMatrix180(board)
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
    return board
};