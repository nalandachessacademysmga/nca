// This script contains the core logic for the Nalanda Chess Academy website.
// It handles UI interactions, Firebase authentication, Firestore data synchronization,
// and integrates with chess.js and chessboard.js for game functionality.

// --- Global Variables (accessible by initializeHeaderUI and other functions) ---
let game = new Chess(); // Initialize a new chess.js game instance. This object manages game rules.
let board = null; // This will hold the chessboard.js instance once initialized.
let currentUser = null; // Stores the currently logged-in Firebase user object.
let gameId = 'default-single-player-game'; // For simplicity, using a fixed game ID combined with the user's UID for individual game persistence.
let gameUnsubscribe = null; // Holds the unsubscribe function for Firestore real-time updates.

// --- DOM Elements (will be initialized after header loads) ---
let homeLinkDesktop;
let visionMissionLinkDesktop;
let aboutLinkDesktop;
let contactLinkDesktop;
let playLinkDesktop;
let profileLinkDesktop;
let authButtonDesktop;

let bottomNavItems;
let bottomNavAuthText;

let startPlayingButton;

let authModal;
let authModalContent;
let closeAuthModalButton;
let emailInput;
let passwordInput;
let loginButton;
let registerButton;
let googleLoginButton;
let authMessage;

let profileUid;
let profileEmail;
let profileDisplayName;

let boardElement;
let newGameButton;
let undoMoveButton;
let engineMoveButton;
let gameStatusElement;

let messageBox;
let messageText;
let closeMessageBoxButton;

// Main content sections (always present in index.html)
const homeSection = document.getElementById('home-section');
const visionMissionSection = document.getElementById('vision-mission-section');
const aboutSection = document.getElementById('about-section');
// Removed contactSection as it's now an external page
// const contactSection = document.getElementById('contact-section'); 
const featuresSection = document.getElementById('features-section');
const testimonialsSection = document.getElementById('testimonials-section');
const secondaryCtaSection = document.getElementById('secondary-cta-section');
const newsEventsSection = document.getElementById('news-events-section');
const playSection = document.getElementById('play-section');
const profileSection = document.getElementById('profile-section');

// Array of all main content sections (excluding modals)
const allContentSections = [
    homeSection,
    visionMissionSection,
    aboutSection,
//  contactSection, 
//  contactSection, 
    featuresSection,
    testimonialsSection,
    secondaryCtaSection,
    newsEventsSection,
    playSection,
    profileSection
];


// --- Firebase Instances ---
// These Firebase instances and functions are imported in index.html (type="module" script)
// and then exposed globally to be accessible by this script.
const app = window.firebaseApp; // The initialized Firebase app
const auth = window.firebaseAuth; // Firebase Authentication service
const db = window.firebaseDb; // Firebase Firestore database service

// Firebase Auth functions
const onAuthStateChanged = window.onAuthStateChanged;
const signInWithEmailAndPassword = window.signInWithEmailAndPassword;
const createUserWithEmailAndPassword = window.createUserWithEmailAndPassword;
const signOut = window.signOut;
const GoogleAuthProvider = window.GoogleAuthProvider;
const signInWithPopup = window.signInWithPopup;

// Firebase Firestore functions
const doc = window.doc;
const setDoc = window.setDoc;
const getDoc = window.getDoc;
const onSnapshot = window.onSnapshot;
const collection = window.collection;
const query = window.query;
const where = window.where;
const updateDoc = window.updateDoc;


/**
 * Initializes all DOM element references and attaches event listeners.
 * This function is called AFTER the header.html content has been loaded into the DOM.
 */
window.initializeHeaderUI = function() {
    // Initialize DOM elements that are part of the dynamically loaded header
    homeLinkDesktop = document.getElementById('home-link-desktop');
    visionMissionLinkDesktop = document.getElementById('vision-mission-link-desktop');
    aboutLinkDesktop = document.getElementById('about-link-desktop');
    contactLinkDesktop = document.getElementById('contact-link-desktop');
    playLinkDesktop = document.getElementById('play-link-desktop');
    profileLinkDesktop = document.getElementById('profile-link-desktop');
    authButtonDesktop = document.getElementById('auth-button-desktop');

    bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavAuthText = document.getElementById('bottom-nav-auth-text');

    // Initialize other DOM elements (these are already in index.html, but good to ensure they are referenced)
    startPlayingButton = document.getElementById('start-playing-button');

    authModal = document.getElementById('auth-modal');
    authModalContent = document.getElementById('auth-modal-content');
    closeAuthModalButton = document.getElementById('close-auth-modal');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    loginButton = document.getElementById('login-button');
    registerButton = document.getElementById('register-button');
    googleLoginButton = document.getElementById('google-login-button');
    authMessage = document.getElementById('auth-message');

    profileUid = document.getElementById('profile-uid');
    profileEmail = document.getElementById('profile-email');
    profileDisplayName = document.getElementById('profile-display-name');

    boardElement = document.getElementById('board');
    newGameButton = document.getElementById('new-game-button');
    undoMoveButton = document.getElementById('undo-move-button');
    engineMoveButton = document.getElementById('engine-move-button');
    gameStatusElement = document.getElementById('game-status');

    messageBox = document.getElementById('message-box');
    messageText = document.getElementById('message-text');
    closeMessageBoxButton = document.getElementById('close-message-box');

    // --- Attach Event Listeners ---

    // Desktop Navigation Links
    homeLinkDesktop.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('home-section');
    });

    visionMissionLinkDesktop.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('vision-mission-section');
    });

    // aboutLinkDesktop and contactLinkDesktop are external links, so they navigate directly
    // No need for event listeners here to call showSection for them.

    playLinkDesktop.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showSection('play-section');
        } else {
            showMessageBox('Please log in to play chess.', 'error');
            showSection('auth-modal');
        }
    });

    profileLinkDesktop.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showSection('profile-section');
        } else {
            showMessageBox('Please log in to view your profile.', 'error');
            showSection('auth-modal');
        }
    });

    // Bottom Navigation Items
    bottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // For external links, allow default navigation behavior
            if (item.getAttribute('href') && item.getAttribute('href').endsWith('.html')) {
                return; // Let the browser handle the navigation
            }

            e.preventDefault();
            const sectionId = item.dataset.section;
            
            if (sectionId === 'auth-modal') {
                if (currentUser) {
                    signOut(auth).then(() => {
                        console.log("User signed out successfully.");
                        showMessageBox("Logged out successfully!", 'success');
                        currentUser = null;
                        showSection('home-section');
                    }).catch((error) => {
                        console.error("Error signing out:", error);
                        showMessageBox("Error logging out: " + error.message, 'error');
                    });
                } else {
                    showSection('auth-modal');
                }
            } else if (sectionId === 'play-section' && !currentUser) {
                showMessageBox('Please log in to play chess.', 'error');
                showSection('auth-modal');
            } else if (sectionId === 'profile-section' && !currentUser) {
                showMessageBox('Please log in to view your profile.', 'error');
                showSection('auth-modal');
            } else {
                showSection(sectionId);
            }
        });
    });

    // "Start Playing" button on the Home section
    startPlayingButton.addEventListener('click', () => {
        if (currentUser) {
            showSection('play-section');
        } else {
            showMessageBox('Please log in to play chess.', 'error');
            showSection('auth-modal');
        }
    });

    // Desktop Auth Button (Login/Logout)
    authButtonDesktop.addEventListener('click', () => {
        if (currentUser) {
            signOut(auth).then(() => {
                console.log("User signed out successfully.");
                showMessageBox("Logged out successfully!", 'success');
                currentUser = null;
                showSection('home-section');
            }).catch((error) => {
                console.error("Error signing out:", error);
                showMessageBox("Error logging out: " + error.message, 'error');
            });
        } else {
            showSection('auth-modal');
        }
    });

    // Close Auth Modal
    closeAuthModalButton.addEventListener('click', () => {
        authModal.classList.add('hidden');
        authModalContent.classList.remove('scale-100');
        authModalContent.classList.add('scale-95');
        authMessage.textContent = '';
    });

    // Email/Password Login
    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showAuthMessage("Please enter both email and password.");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in:", userCredential.user);
            showMessageBox("Logged in successfully!", 'success');
            authModal.classList.add('hidden');
        } catch (error) {
            console.error("Login error:", error);
            showAuthMessage("Login failed: " + error.message, true);
        }
    });

    // Email/Password Register
    registerButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showAuthMessage("Please enter both email and password.");
            return;
        }
        if (password.length < 6) {
            showAuthMessage("Password should be at least 6 characters.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User registered:", userCredential.user);
            showMessageBox("Registered and logged in successfully!", 'success');
            authModal.classList.add('hidden');
        } catch (error) {
            console.error("Registration error:", error);
            showAuthMessage("Registration failed: " + error.message, true);
        }
    });

    // Google Login
    googleLoginButton.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("Google user logged in:", result.user);
            showMessageBox("Logged in with Google successfully!", 'success');
            authModal.classList.add('hidden');
        } catch (error) {
            console.error("Google login error:", error);
            showAuthMessage("Google login failed: " + error.message, true);
        }
    });

    // New Game, Undo, and Engine Move Buttons
    newGameButton.addEventListener('click', startNewGame);
    undoMoveButton.addEventListener('click', undoLastMove);
    engineMoveButton.addEventListener('click', makeEngineMove);

    // Close custom message box
    closeMessageBoxButton.addEventListener('click', hideMessageBox);

    // Initial authentication state check and UI update (now that elements are guaranteed to exist)
    onAuthStateChanged(auth, (user) => {
        currentUser = user; // Update global user variable
        
        // Update desktop auth button text
        if (authButtonDesktop) authButtonDesktop.textContent = user ? 'Logout' : 'Login';
        // Update bottom nav auth text
        if (bottomNavAuthText) bottomNavAuthText.textContent = user ? 'Logout' : 'Login';

        // Update profile info
        if (profileUid) profileUid.textContent = user ? user.uid : 'Not logged in';
        if (profileEmail) profileEmail.textContent = user ? (user.email || 'N/A') : 'Not logged in';
        if (profileDisplayName) profileDisplayName.textContent = user ? (user.displayName || user.email.split('@')[0]) : 'N/A';

        console.log("Auth state changed: User is", user ? "logged in" : "logged out", user ? user.uid : "");

        // If user logs in and is currently on the Play section, ensure board is initialized and listening
        // or if they are on the auth modal and just logged in, redirect them to home
        if (user && authModal && authModal.classList.contains('hidden')) { // If logged in and modal is not active
            // If current section is play, ensure game is loaded
            if (playSection && !playSection.classList.contains('hidden')) {
                initBoard();
                listenForGameUpdates();
            }
        } else if (user && authModal && !authModal.classList.contains('hidden')) { // If logged in and modal IS active
            // User just logged in via modal, redirect to home
            showSection('home-section');
        }
        else if (!user && authModal && !authModal.classList.contains('hidden')) {
            // User logged out via modal, ensure content is home
            showSection('home-section');
        }
        else if (!user && homeSection && !homeSection.classList.contains('hidden')) {
            // If logged out and on home, do nothing
        }
        else if (!user) { // If logged out and not on home or modal
            showSection('home-section'); // Redirect to home
        }
    });

    // Initial display of the home section and set active state for its bottom nav item
    // This should only run on index.html
    const currentPathname = window.location.pathname;
    if (currentPathname.endsWith('/') || currentPathname.endsWith('index.html')) {
        showSection('home-section');
    }
    // For other pages (about-us.html, contact_us.html), their own inline scripts will handle active states.
};


// --- Helper Functions ---

/**
 * Displays a custom, non-blocking message box notification.
 * @param {string} message - The text message to display.
 * @param {string} type - The type of message ('success', 'error', 'info').
 * Determines the background color of the message box.
 */
function showMessageBox(message, type = 'info') {
    if (!messageBox || !messageText) return; // Ensure elements exist

    messageText.textContent = message; // Set the message text
    // Remove previous type-specific background classes
    messageBox.classList.remove('bg-green-600', 'bg-red-600', 'bg-blue-600');
    // Add the appropriate background class based on message type
    if (type === 'success') {
        messageBox.classList.add('bg-green-600');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-600');
    } else {
        messageBox.classList.add('bg-blue-600');
    }
    // Make the message box visible and animate it in
    messageBox.classList.remove('hidden', 'translate-y-full', 'opacity-0');
    messageBox.classList.add('translate-y-0', 'opacity-100');

    // Automatically hide the message box after 5 seconds
    setTimeout(() => {
        hideMessageBox(); // Trigger hide animation
    }, 5000);
}

/**
 * Hides the custom message box with an animation.
 */
function hideMessageBox() {
    if (!messageBox) return; // Ensure element exists
    // Animate the message box out by sliding down and fading out
    messageBox.classList.remove('translate-y-0', 'opacity-100');
    messageBox.classList.add('translate-y-full', 'opacity-0');
    // Once the animation is complete, fully hide the element
    setTimeout(() => messageBox.classList.add('hidden'), 400);
}

/**
 * Displays an authentication-related message within the auth modal.
 * @param {string} message - The message to display.
 * @param {boolean} isError - If true, style as an error message (red text); otherwise, green text.
 */
function showAuthMessage(message, isError = true) {
    if (!authMessage) return; // Ensure element exists
    authMessage.textContent = message;
    authMessage.className = `text-center text-sm mt-4 ${isError ? 'text-red-500' : 'text-green-500'}`;
}

/**
 * Switches the active content section and updates active navigation items.
 * This function is designed for internal page sections on index.html.
 * @param {HTMLElement | string} target - The HTML element (section) to show, or its ID string.
 */
function showSection(target) {
    let sectionToShow;
    if (typeof target === 'string') {
        sectionToShow = document.getElementById(target);
    } else {
        sectionToShow = target;
    }

    // Handle special case for 'auth-modal' which is a modal, not a content section
    if (sectionToShow && sectionToShow.id === 'auth-modal') {
        if (authModal && authModalContent) {
            authModal.classList.remove('hidden');
            authModalContent.classList.remove('scale-95');
            authModalContent.classList.add('scale-100');
        }
        return;
    } else {
        if (authModal) authModal.classList.add('hidden'); // Ensure modal is hidden if navigating to a content section
    }

    // Hide all main content sections
    allContentSections.forEach(section => {
        if (section) section.classList.add('hidden');
    });

    // Show the target content section
    if (sectionToShow) {
        sectionToShow.classList.remove('hidden');
    }

    // Update active class on desktop navigation links
    // Note: aboutLinkDesktop and contactLinkDesktop are external links, so they are not managed here.
    // Their active state is handled by the script on their respective HTML pages.
    [homeLinkDesktop, visionMissionLinkDesktop, playLinkDesktop, profileLinkDesktop].forEach(link => {
        if (link) { // Ensure link exists (important for dynamic content)
            if (link.dataset.section === sectionToShow.id) {
                link.classList.add('bg-white', 'bg-opacity-10');
            } else {
                link.classList.remove('bg-white', 'bg-opacity-10');
            }
        }
    });

    // Update active class on bottom navigation items
    bottomNavItems.forEach(item => {
        // For external links (like about-us.html, contact_us.html), this script on index.html
        // should not set their active state. Their own page's script will handle it.
        if (item.getAttribute('href') && item.getAttribute('href').endsWith('.html')) {
            item.classList.remove('active'); // Ensure it's not active on index.html
        } else if (item.dataset.section === sectionToShow.id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Specific logic for Play section
    if (sectionToShow.id === 'play-section' && currentUser) {
        initBoard();
        listenForGameUpdates();
    } else if (gameUnsubscribe) {
        gameUnsubscribe(); // Stop listening if leaving play section
        gameUnsubscribe = null;
    }
}

/**
 * Updates the game status text displayed below the chessboard.
 * Checks for game over conditions (checkmate, draw) and whose turn it is.
 */
function updateGameStatus() {
    if (!gameStatusElement) return; // Ensure element exists

    let status = '';
    let moveColor = 'White';
    if (game.turn() === 'b') { // 'b' for black, 'w' for white
        moveColor = 'Black';
    }

    // Check for game over conditions using chess.js
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
        showMessageBox(status, 'info'); // Notify user of game end
    } else if (game.in_draw()) {
        status = 'Game over, drawn position.';
        showMessageBox(status, 'info'); // Notify user of draw
    } else {
        // Game is still in progress
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check!';
            showMessageBox(moveColor + ' is in check!', 'info'); // Notify if a player is in check
        }
    }
    gameStatusElement.textContent = status; // Update the UI element
}

/**
 * Handles a piece drop event on the chessboard.
 * This function is called by chessboard.js when a piece is moved.
 * @param {string} source - The starting square of the piece (e.g., 'e2').
 * @param {string} target - The destination square of the piece (e.g., 'e4').
 * @returns {boolean} - Returns 'snapback' if the move is illegal, true if valid.
 */
function onDrop(source, target) {
    // Prevent moves if user is not logged in
    if (!currentUser) {
        showMessageBox('Please log in to play.', 'error');
        return 'snapback'; // Snap back the piece
    }

    // Attempt to make the move using chess.js
    // 'promotion: 'q'' automatically promotes pawns to queens for simplicity.
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity. In a real game, prompt user.
    });

    // If the move is null, it means it's an illegal move according to chess.js rules
    if (move === null) {
        showMessageBox('Illegal move!', 'error');
        return 'snapback'; // Snap back the piece to its original position
    }

    // If the move is legal, update the game state in Firestore
    updateFirestoreGame(game.fen());

    // Update the game status display
    updateGameStatus();
    return true; // Indicate that the move was valid
}

/**
 * Called by chessboard.js when a piece is picked up (drag started).
 * @param {string} source - The square the piece is being picked from.
 * @param {string} piece - The FEN representation of the piece (e.g., 'wP' for white pawn).
 * @returns {boolean} - True if the piece can be dragged, false otherwise.
 */
function onDragStart(source, piece) {
    // Prevent dragging if the game is over or if it's not the correct player's turn
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) || // If white's turn, cannot drag black pieces
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) { // If black's turn, cannot drag white pieces
        return false;
    }
    return true;
}

/**
 * Initializes the chessboard.js instance.
 * This function ensures the board is only created once.
 */
function initBoard() {
    if (board) { // Check if the board has already been initialized
        return; // If yes, do nothing
    }
    // Configuration object for chessboard.js
    const config = {
        draggable: true, // Allow pieces to be dragged
        position: 'start', // Start with the default chess starting position
        onDragStart: onDragStart, // Callback for when a piece is picked up
        onDrop: onDrop, // Callback for when a piece is dropped
        onSnapEnd: updateGameStatus // Callback after piece animation, useful for updating status
    };
    // Create the chessboard instance and attach it to the 'board' div
    if (boardElement) { // Ensure boardElement exists
        board = Chessboard('board', config);
        updateGameStatus(); // Set initial game status
        // Add event listener to resize the board when the window is resized
        window.addEventListener('resize', board.resize);
    } else {
        console.error("Chessboard element not found. Cannot initialize board.");
    }
}

/**
 * Resets the game to the starting position and updates Firestore.
 */
function startNewGame() {
    game.reset(); // Reset the chess.js game state
    if (board) board.position('start'); // Reset the visual board to the starting position
    updateGameStatus(); // Update game status display
    updateFirestoreGame(game.fen()); // Save the new initial state to Firestore
    showMessageBox('New game started!', 'success'); // Notify the user
}

/**
 * Undoes the last move made in the game and updates Firestore.
 */
function undoLastMove() {
    game.undo(); // Undo the last move using chess.js
    if (game.history().length === 0) {
        showMessageBox('No more moves to undo.', 'info'); // Inform if no moves to undo
    } else {
        showMessageBox('Last move undone.', 'success'); // Confirm undo
    }
    if (board) board.position(game.fen()); // Update the visual board to the new FEN
    updateGameStatus(); // Update game status display
    updateFirestoreGame(game.fen()); // Save the updated state to Firestore
}

/**
 * Placeholder function for making an engine (AI) move.
 * This would typically involve calling a chess engine (e.g., Stockfish.js)
 * to calculate the best move and then applying it to the board.
 */
function makeEngineMove() {
    showMessageBox('Engine move functionality is not yet implemented.', 'info');
    // TODO: Implement actual chess engine integration here.
    // Example conceptual flow:
    // 1. Get the current FEN: const currentFen = game.fen();
    // 2. Call your chess engine with the FEN to get the best move.
    //    This might be a local JS engine or an API call to a Cloud Function running an engine.
    // 3. Apply the engine's move: game.move(bestMove);
    // 4. Update the board: board.position(game.fen());
    // 5. Update Firestore: updateFirestoreGame(game.fen());
    // 6. Update status: updateGameStatus();
}

// --- Firebase Firestore Game Management ---

/**
 * Updates the current game state (FEN) in Cloud Firestore.
 * Each user will have their own game document based on their UID.
 * @param {string} fen - The FEN string representing the current state of the board.
 */
async function updateFirestoreGame(fen) {
    // Ensure a user is logged in before attempting to save game state
    if (!currentUser) {
        console.warn("Cannot update Firestore game: User not logged in.");
        return;
    }
    // Construct a unique game ID for the current user's single-player game
    const userGameId = `${gameId}-${currentUser.uid}`;
    // Get a reference to the specific game document in the 'userGames' collection
    const gameRef = doc(db, 'userGames', userGameId);
    try {
        // Set or update the document with the new FEN and timestamp.
        // `merge: true` ensures that only specified fields are updated,
        // preserving other fields if they exist.
        await setDoc(gameRef, {
            fen: fen,
            lastUpdated: new Date(),
            playerUid: currentUser.uid, // Store the UID of the player for this game
        }, { merge: true }); // `merge: true` ensures that only specified fields are updated
        console.log("Game state updated in Firestore.");
    } catch (error) {
        console.error("Error updating game state in Firestore:", error);
        showMessageBox("Failed to save game progress.", 'error'); // Notify user of error
    }
}

/**
 * Sets up a real-time listener for game state updates from Cloud Firestore.
 * This ensures the board updates automatically if the game state changes in the database.
 */
function listenForGameUpdates() {
    // If a previous listener exists, unsubscribe from it to prevent multiple listeners
    if (gameUnsubscribe) {
        gameUnsubscribe();
    }

    // Ensure a user is logged in before setting up a listener
    if (!currentUser) {
        console.warn("Cannot listen for game updates: User not logged in.");
        return;
    }

    // Construct the user-specific game ID
    const userGameId = `${gameId}-${currentUser.uid}`;
    // Get a reference to the specific game document
    const gameRef = doc(db, 'userGames', userGameId);

    // Set up the real-time listener using onSnapshot
    gameUnsubscribe = onSnapshot(gameRef, (docSnap) => {
        if (docSnap.exists()) {
            // If the document exists, get its data
            const data = docSnap.data();
            const newFen = data.fen;
            // Only update the board if the FEN has actually changed (to avoid unnecessary re-renders)
            if (newFen && newFen !== game.fen()) {
                game.load(newFen); // Load the new FEN into chess.js
                if (board) board.position(newFen); // Update the visual board
                updateGameStatus(); // Update the game status display
                console.log("Game state updated from Firestore:", newFen);
                showMessageBox('Game state updated!', 'info'); // Notify user of update
            }
        } else {
            // If the document does not exist (e.g., first time user plays), start a new game
            console.log("No game data found in Firestore for this user. Starting new game.");
            startNewGame();
        }
    }, (error) => {
        // Handle any errors during real-time listening
        console.error("Error listening to game updates:", error);
        showMessageBox("Error loading game updates.", 'error');
    });
}

