/*  chess-logic.js
 *  ----------  -----------------
 *  Keeps a single Chess instance,
 *  validates moves, updates UI, and
 *  exposes a tiny API for other scripts.
 */
import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@latest/chess.js';

export class ChessLogic {
    constructor() {
        // chess.js instance – holds the board state
        this.game = new Chess();
		this.history = [];
		this.gameStarted = false;
		this.fen = ''; // Current FEN string (may be set by loadPosition)
	

        // Cache DOM nodes we’ll update
        // this.fenEl   = document.getElementById('current-fen');
        // this.movesEl = document.getElementById('moves');

        // Render the initial FEN
        // this.updateUI();
    }

    /* Loads a new position from a FEN string */
    setPosition(fen) {
        const ok = this.game.load(fen);
        if (!ok) {
            alert('Invalid FEN string!');
            return false;
        }
        this.updateUI();
        return true;
    }

    /* Called whenever a piece is dropped */
    onDrop(source, target, piece, newPos, oldPos, orientation) {
        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q'          // auto‑promote to queen (simplest for puzzles)
        });

        // Illegal move – revert it
        if (move === null) return 'snapback';

        // Move was legal – update UI
        this.updateUI();
        return null;               // keep the snap
    }

    /* Update the FEN display and the move list */
    updateUI() {
        this.fenEl.textContent = this.game.fen();
        this.movesEl.textContent = this.game.history().join(' ');
    }
}
