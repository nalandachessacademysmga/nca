/*  script.js
 *  ---------
 *  Handles the page‑level glue: initializing the board,
 *  wiring the “Load Position” button and delegating
 *  drag‑drop events to ChessLogic.
 */

import { ChessLogic } from './chess-logic.js';

const boardEl = document.getElementById('board');
const fenInput = document.getElementById('fenInput');
const loadBtn  = document.getElementById('loadBtn');

const logic = new ChessLogic();

// Initialise the board with the default position
const board = Chessboard(boardEl, {
    draggable: true,
    position: 'start',
    orientation: 'white',
	
	/*  Tell the library where the piece images live.
     *  The `{piece}` placeholder will be replaced with:
     *      bR, bN, bB, bQ, bK, bP,
     *      wR, wN, wB, wQ, wK, wP
     */
    pieceTheme:  'img/chesspieces/wikipedia/{piece}.png',
	
	/*  Keep the drag‑drop logic wired to your ChessLogic
     *  instance
     */
    onDrop: (source, target, piece, newPos, oldPos, orientation) => {
        const result = logic.onDrop(source, target, piece, newPos, oldPos, orientation);
		// If the move is illegal, let Chessboard snap back
        if (result === 'snapback') {
            // Let the library snap back the piece
            return 'snapback';
        }
        // The board already reflects the new position via Chessboard.update()
        return null;
    }
});

// Load button handler
loadBtn.addEventListener('click', () => {
    const fen = fenInput.value.trim();
    if (!fen) {
        alert('Please paste a FEN string.');
        return;
    }

    if (logic.setPosition(fen)) {
        // Tell Chessboard to update itself to the new FEN
        board.position(fen, true);      // true = do not animate
    }
});
