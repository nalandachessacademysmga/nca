// This script contains the core logic for the Nalanda Chess Academy website.
// It handles UI interactions, Firebase authentication, Firestore data synchronization,
// and integrates with chess.js and chessboard.js for game functionality.

// --- DOM Elements ---
// Get references to various HTML elements by their IDs.
// These elements will be manipulated by JavaScript to update the UI.
const homeSection = document.getElementById('home-section');
const visionMissionSection = document.getElementById('vision-mission-section');
const aboutSection = document.getElementById('about-section');
// Removed contactSection as it's now an external page
const contactSection = document.getElementById('contact-section'); 
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
    contactSection, 
    contactSection, 
    featuresSection,
    testimonialsSection,
    secondaryCtaSection,
    newsEventsSection,
    playSection,
    profileSection
];

// Desktop Navigation Links and Button
const homeLinkDesktop = document.getElementById('home-link-desktop');
const visionMissionLinkDesktop = document.getElementById('vision-mission-link-desktop');
const aboutLinkDesktop = document.getElementById('about-link-desktop');
const contactLinkDesktop = document.getElementById('contact-link-desktop'); 
const playLinkDesktop = document.getElementById('play-link-desktop');
const profileLinkDesktop = document.getElementById('profile-link-desktop');
const authButtonDesktop = document.getElementById('auth-button-desktop'); // Desktop Login/Logout button

// Bottom Navigation Links and Text
const bottomNavItems = document.querySelectorAll('.bottom-nav-item'); // All bottom navigation links
const bottomNavAuthText = document.getElementById('bottom-nav-auth-text'); // Text for Login/Logout in bottom nav

const startPlayingButton = document.getElementById('start-playing-button'); // Button on Home section

const authModal = document.getElementById('auth-modal'); // The login/register modal
const authModalContent = document.getElementById('auth-modal-content'); // Content inside the modal for animation
const closeAuthModalButton = document.getElementById('close-auth-modal'); // Button to close the modal
const emailInput = document.getElementById('email'); // Email input field in modal
const passwordInput = document.getElementById('password'); // Password input field in modal
const loginButton = document.getElementById('login-button'); // Login button in modal
const registerButton = document.getElementById('register-button'); // Register button in modal
const googleLoginButton = document.getElementById('google-login-button'); // Google login button in modal
const authMessage = document.getElementById('auth-message'); // Message display area in modal

const profileUid = document.getElementById('profile-uid'); // User ID display in profile section
const profileEmail = document.getElementById('profile-email'); // User email display in profile section
const profileDisplayName = document.getElementById('profile-display-name'); // User display name in profile section

const boardElement = document.getElementById('board'); // The chess board container
const newGameButton = document.getElementById('new-game-button'); // Button to start a new game
const undoMoveButton = document.getElementById('undo-move-button'); // Button to undo the last move
const engineMoveButton = document.getElementById('engine-move-button'); // Button for AI/Engine move (placeholder)
const gameStatusElement = document.getElementById('game-status'); // Displays current game status (e.g., "White to move")

const messageBox = document.getElementById('message-box'); // Custom notification box
const messageText = document.getElementById('message-text'); // Text content of the notification box
const closeMessageBoxButton = document.getElementById('close-message-box'); // Button to close the notification box

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

// --- Chess Game Variables ---
let game = new Chess(); // Initialize a new chess.js game instance. This object manages game rules.
let board = null; // This will hold the chessboard.js instance once initialized.
let currentUser = null; // Stores the currently logged-in Firebase user object.
// For simplicity, using a fixed game ID combined with the user's UID for individual game persistence.
// For a true multiplayer system, `gameId` would be dynamically generated and shared between players.
let gameId = 'default-single-player-game';
let gameUnsubscribe = null; // Holds the unsubscribe function for Firestore real-time updates.

// --- Helper Functions ---

/**
 * Displays a custom, non-blocking message box notification.
 * @param {string} message - The text message to display.
 * @param {string} type - The type of message ('success', 'error', 'info').
 * Determines the background color of the message box.
 */
function showMessageBox(message, type = 'info') {
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
    authMessage.textContent = message;
    authMessage.className = `text-center text-sm mt-4 ${isError ? 'text-red-500' : 'text-green-500'}`;
}

/**
 * Switches the active content section and updates active navigation items.
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
        authModal.classList.remove('hidden');
        authModalContent.classList.remove('scale-95');
        authModalContent.classList.add('scale-100');
        // Do not hide other sections or mark nav items active for a modal
        return;
    } else {
        authModal.classList.add('hidden'); // Ensure modal is hidden if navigating to a content section
    }

    // Hide all main content sections
    allContentSections.forEach(section => { // Use the new allContentSections array
        section.classList.add('hidden');
    });

    // Show the target content section
    if (sectionToShow) {
        sectionToShow.classList.remove('hidden');
    }

    // Update active class on desktop navigation links
    // aboutLinkDesktop and contactLinkDesktop are now external links, so they are not handled here
    [homeLinkDesktop, visionMissionLinkDesktop, aboutLinkDesktop, playLinkDesktop, profileLinkDesktop].forEach(link => {
        if (link.dataset.section === sectionToShow.id) {
            link.classList.add('bg-white', 'bg-opacity-10');
        } else {
            link.classList.remove('bg-white', 'bg-opacity-10');
        }
    });

    // Update active class on bottom navigation items
    bottomNavItems.forEach(item => {
        // For external links, we don't use data-section for internal switching
        // We only set active class if the current page *is* that external page.
        // This script runs on index.html, so external links should not be marked active by it.
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
    board = Chessboard('board', config);
    updateGameStatus(); // Set initial game status
    
    // Add event listener to resize the board when the window is resized
    window.addEventListener('resize', board.resize);
}

/**
 * Resets the game to the starting position and updates Firestore.
 */
function startNewGame() {
    game.reset(); // Reset the chess.js game state
    board.position('start'); // Reset the visual board to the starting position
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
    board.position(game.fen()); // Update the visual board to the new FEN
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
                board.position(newFen); // Update the visual board
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

// --- Event Listeners ---
// Attach event listeners to various UI elements to handle user interactions.

// Desktop Navigation Links
homeLinkDesktop.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('home-section');
});

visionMissionLinkDesktop.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('vision-mission-section');
});

// aboutLinkDesktop and contactLinkDesktop are now external links, so they don't use showSection
// They navigate directly via their href attribute

playLinkDesktop.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        showSection('play-section'); // Show the play section if logged in
        initBoard(); // Initialize the board if it hasn't been already
        listenForGameUpdates(); // Start listening for game updates
    } else {
        showMessageBox('Please log in to play chess.', 'error');
        showSection('auth-modal'); // Show auth modal
    }
});

profileLinkDesktop.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        showSection('profile-section'); // Show the profile section if logged in
    } else {
        showMessageBox('Please log in to view your profile.', 'error');
        showSection('auth-modal'); // Show auth modal
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
        const sectionId = item.dataset.section; // Get the target section ID from data-section attribute
        
        // Special handling for the auth button in bottom nav
        if (sectionId === 'auth-modal') {
            if (currentUser) {
                // If logged in, this button acts as logout
                signOut(auth).then(() => {
                    console.log("User signed out successfully.");
                    showMessageBox("Logged out successfully!", 'success');
                    currentUser = null;
                    showSection('home-section'); // Go to home after logout
                }).catch((error) => {
                    console.error("Error signing out:", error);
                    showMessageBox("Error logging out: " + error.message, 'error');
                });
            } else {
                // If logged out, show the auth modal
                showSection('auth-modal');
            }
        } else if (sectionId === 'play-section' && !currentUser) {
            showMessageBox('Please log in to play chess.', 'error');
            showSection('auth-modal');
        } else if (sectionId === 'profile-section' && !currentUser) {
            showMessageBox('Please log in to view your profile.', 'error');
            showSection('auth-modal');
        }
        else {
            showSection(sectionId);
        }
    });
});


// "Start Playing" button on the Home section
startPlayingButton.addEventListener('click', () => {
    if (currentUser) {
        showSection(playSection); // Show the play section if logged in
        initBoard(); // Initialize the board if it hasn't been already
        listenForGameUpdates(); // Start listening for game updates
    } else {
        showMessageBox('Please log in to play chess.', 'error'); // Prompt login if not authenticated
        authModal.classList.remove('hidden'); // Show the authentication modal
    }
});

// Authentication Button (toggles between Login and Logout)
authButton.addEventListener('click', () => {
    if (currentUser) {
        // If a user is currently logged in, clicking the button logs them out
        signOut(auth).then(() => {
            console.log("User signed out successfully.");
            showMessageBox("Logged out successfully!", 'success'); // Success message
            currentUser = null; // Clear the global currentUser variable
            showSection('home-section'); // Redirect to home page after logout
        }).catch((error) => {
            console.error("Error signing out:", error);
            showMessageBox("Error logging out: " + error.message, 'error'); // Error message
        });
    } else {
        showSection('auth-modal');
    }
});

// Close Authentication Modal Button
closeAuthModalButton.addEventListener('click', () => {
    authModal.classList.add('hidden'); // Hide the modal
    authModalContent.classList.remove('scale-100'); // Reset scale for modal exit animation
    authModalContent.classList.add('scale-95');
    authMessage.textContent = ''; // Clear any previous auth messages
});

// Email/Password Login Form Submission
loginButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthMessage("Please enter both email and password."); // Validate inputs
        return;
    }

    try {
        // Attempt to sign in with email and password using Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        showMessageBox("Logged in successfully!", 'success'); // Success message
        authModal.classList.add('hidden'); // Hide the modal
        // The onAuthStateChanged listener will handle updating the UI (authButton, profile info)
    } catch (error) {
        console.error("Login error:", error);
        showAuthMessage("Login failed: " + error.message, true); // Display error message
    }
});

// Email/Password Registration Form Submission
registerButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent default form submission
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthMessage("Please enter both email and password."); // Validate inputs
        return;
    }
    if (password.length < 6) { // Firebase password minimum length
        showAuthMessage("Password should be at least 6 characters.");
        return;
    }

    try {
        // Attempt to create a new user with email and password using Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);
        showMessageBox("Registered and logged in successfully!", 'success'); // Success message
        authModal.classList.add('hidden'); // Hide the modal
        // The onAuthStateChanged listener will handle updating the UI
    } catch (error) {
        console.error("Registration error:", error);
        showAuthMessage("Registration failed: " + error.message, true); // Display error message
    }
});

// Google Login Button
googleLoginButton.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider(); // Create a new Google Auth Provider instance
    try {
        // Attempt to sign in with Google popup using Firebase Auth
        const result = await signInWithPopup(auth, provider);
        console.log("Google user logged in:", result.user);
        showMessageBox("Logged in with Google successfully!", 'success'); // Success message
        authModal.classList.add('hidden'); // Hide the modal
        // The onAuthStateChanged listener will handle updating the UI
    } catch (error) {
        console.error("Google login error:", error);
        showAuthMessage("Google login failed: " + error.message, true); // Display error message
    }
});

// New Game, Undo, and Engine Move Buttons
newGameButton.addEventListener('click', startNewGame);

// Undo Move Button
undoMoveButton.addEventListener('click', undoLastMove);

// Engine Move Button (placeholder)
engineMoveButton.addEventListener('click', makeEngineMove);

// Close Custom Message Box Button
closeMessageBoxButton.addEventListener('click', hideMessageBox);


// --- Initial Setup ---
// This block runs once when the script loads and sets up the initial state.

// Listen for authentication state changes globally.
// This is critical for updating UI elements based on login status.
onAuthStateChanged(auth, (user) => {
    currentUser = user; // Update global user variable
    
    // Update desktop auth button text
    authButtonDesktop.textContent = user ? 'Logout' : 'Login';
    // Update bottom nav auth text
    bottomNavAuthText.textContent = user ? 'Logout' : 'Login';

    // Update profile info
    profileUid.textContent = user ? user.uid : 'Not logged in';
    profileEmail.textContent = user ? (user.email || 'N/A') : 'Not logged in';
    profileDisplayName.textContent = user ? (user.displayName || user.email.split('@')[0]) : 'N/A';

    console.log("Auth state changed: User is", user ? "logged in" : "logged out", user ? user.uid : "");

    // If user logs in and is currently on the Play section, ensure board is initialized and listening
    // or if they are on the auth modal and just logged in, redirect them to home
    if (user && authModal.classList.contains('hidden')) { // If logged in and modal is not active
        // If current section is play, ensure game is loaded
        if (!playSection.classList.contains('hidden')) {
            initBoard();
            listenForGameUpdates();
        }
    } else if (user && !authModal.classList.contains('hidden')) { // If logged in and modal IS active
        // User just logged in via modal, redirect to home
        showSection('home-section');
    }
    else if (!user && !authModal.classList.contains('hidden')) {
        // User logged out via modal, ensure content is home
        showSection('home-section');
    }
    else if (!user && !homeSection.classList.contains('hidden')) {
        // If logged out and on home, do nothing
    }
    else if (!user) { // If logged out and not on home or modal
        showSection('home-section'); // Redirect to home
    }
});

// Initially display the home section when the page loads.
showSection('home-section');

// The chessboard initialization and game update listening are now tied
// to user login and navigation to the 'Play' section, ensuring resources
// are only loaded when needed.
