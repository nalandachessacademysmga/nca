// Main script for admin-utility.html, e.g., admin-main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD86XmFYQOqli4BQsNQERh-kDTYeetAqqM",
    authDomain: "nalandachessacademy-474db.firebaseapp.com",
    projectId: "nalandachessacademy-474db",
    storageBucket: "nalandachessacademy-474db-7w9pw.firebasestorage.app",
    messagingSenderId: "30847597506",
    appId: "1:30847597506:web:05c9013240835edee9745b",
    measurementId: "G-Z301KFQ12C"
};

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authSection = document.getElementById('auth-section');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');

const appContainer = document.getElementById('app-container');
const dashboardContent = document.getElementById('dashboard-content');
const adminMenu = document.getElementById('admin-menu');
const userIconBtn = document.getElementById('user-icon-btn');
const userDropdownMenu = document.getElementById('user-dropdown-menu');
const userDisplayName = document.getElementById('user-display-name');
const logoutButton = document.getElementById('logout-button');

// A map to store menu items and their associated content files
const menuItems = {
    'Events': { file: 'admin-events-content.html', logicFile: 'admin-events-logic.js', role: ['admin', 'editor'], icon: 'fas fa-calendar-alt' },
    'Gallery': { file: 'admin-gallery-content.html', logicFile: 'admin-gallery-logic.js', role: ['admin', 'editor'], icon: 'fas fa-images' },
    'WallOfFame': { file: 'admin-walloffame-content.html', logicFile: 'admin-walloffame-logic.js', role: ['admin', 'editor'], icon: 'fas fa-trophy' },
    'Testimonials': { file: 'admin-testimonials-content.html', logicFile: 'admin-testimonials-logic.js', role: ['admin', 'editor'], icon: 'fas fa-comment-alt' },
    'Users': { file: 'admin-users-content.html', logicFile: 'admin-users-logic.js', role: ['admin'], icon: 'fas fa-users' },
    'ConfCall': { file: 'admin-confcall-content.html', logicFile: 'admin-confcall-logic.js', role: ['admin', 'editor'], icon: 'fas fa-video' },
};

// Function to render the menu based on the user's role
function renderMenu(role) {
    adminMenu.innerHTML = '';
    for (const [name, config] of Object.entries(menuItems)) {
        if (config.role.includes(role)) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-section="${name.toLowerCase()}" class="menu-item block px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-200">
                                <i class="${config.icon} mr-2"></i><span>${name}</span>
                            </a>`;
            adminMenu.appendChild(li);
        }
    }
}

// Function to load the content for the selected menu item
async function loadContent(section) {
    console.log(`[DEBUG] Attempting to load content for section: "${section}"`);
    console.log(`[DEBUG] Keys in menuItems object: ${Object.keys(menuItems).join(', ')}`);
    const sectionConfigKey = Object.keys(menuItems).find(key => key.toLowerCase() === section);
    console.log(`[DEBUG] Matched key: "${sectionConfigKey}"`);
    if (!sectionConfigKey) {
        console.warn(`[DEBUG] No configuration found for section: "${section}"`);
        return;
    }
    const sectionConfig = menuItems[sectionConfigKey];

    try {
        const response = await fetch(sectionConfig.file);
        const content = await response.text();
        dashboardContent.innerHTML = content;
        
        console.log(`[DEBUG] Successfully fetched content from file: "${sectionConfig.file}"`);
        
        if (sectionConfig.logicFile) {
            console.log(`[DEBUG] Attempting to load logic file: "${sectionConfig.logicFile}"`);
            // Dynamically load and execute the corresponding script for the content section
            const script = document.createElement('script');
            script.src = sectionConfig.logicFile;
            script.type = 'module';
            dashboardContent.appendChild(script);

            console.log(`[DEBUG] Script element added: "${script.src}"`);
        } else {
            console.log(`[DEBUG] No logic file specified for section: "${section}"`);
        }

    } catch (error) {
        console.error(`[DEBUG] Failed to load content for ${section}:`, error);
        dashboardContent.innerHTML = `<div class="text-red-500 text-center">Failed to load content. Please try again.</div>`;
    }
}

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userRole = userDoc.exists() ? userDoc.data().role : null;
            console.log(`[DEBUG] User authenticated. UID: ${user.uid}, Role: ${userRole}`);

            if (userRole && ['admin', 'editor'].includes(userRole)) {
                // User is authenticated and has a valid role. Show the dashboard.
                authSection.classList.add('hidden');
                appContainer.classList.remove('hidden');

                // Update user display name and render menu
                userDisplayName.textContent = user.email;
                renderMenu(userRole);

                // Add event listeners to menu items
                adminMenu.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (e.target.closest('.menu-item')) {
                        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
                        e.target.closest('.menu-item').classList.add('active');
                        loadContent(e.target.closest('.menu-item').dataset.section);
                    }
                });

                // Load a default page on sign-in, e.g., Testimonials
                loadContent('testimonials'); 
                document.querySelector('[data-section="testimonials"]').classList.add('active');

            } else {
                // User is authenticated but does not have a valid role. Sign them out.
                await signOut(auth);
                authError.textContent = 'Access denied: Insufficient permissions.';
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            await signOut(auth);
        }
    } else {
        // User is signed out. Show login form and hide dashboard.
        authSection.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// Login form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('hidden');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        authError.textContent = "Invalid email or password.";
        authError.classList.remove('hidden');
    }
});

// User icon click listener to toggle the dropdown
userIconBtn.addEventListener('click', () => {
    userDropdownMenu.classList.toggle('hidden');
});

// Logout button
logoutButton.addEventListener('click', async () => {
    await signOut(auth);
});

// Hide dropdown if user clicks outside of it
window.addEventListener('click', (e) => {
    if (!userIconBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
        userDropdownMenu.classList.add('hidden');
    }
});
