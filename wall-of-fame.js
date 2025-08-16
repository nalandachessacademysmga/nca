// wall-of-fame.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
// Make sure this configuration matches your project's details
const firebaseConfig = {
  apiKey: "AIzaSyD86XmFYQOqli4BQsNQERh-kDTYeetAqqM",
  authDomain: "nalandachessacademy-474db.firebaseapp.com",
  projectId: "nalandachessacademy-474db",
  storageBucket: "nalandachessacademy-474db-7w9pw.firebasestorage.app",
  messagingSenderId: "30847597506",
  appId: "1:30847597506:web:05c9013240835edee9745b",
  measurementId: "G-Z301KFQ12C"
};

// --- Global Variables ---
const appId = "nalandachessacademy-474db";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const wallOfFameContainer = document.getElementById('wall-of-fame-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// --- Core Functionality ---

/**
 * Renders a single wall of fame card based on the provided data.
 * @param {object} data - The achievement object.
 * @returns {string} - The HTML string for the card.
 */
function createWallOfFameCard(data) {
  const dateEvent = (data.date && data.event) ? `${data.date} - ${data.event}` : (data.date || data.event);

    return `
        <div class="wall-of-fame-card bg-white rounded-lg shadow-xl transform transition-transform duration-300 hover:scale-105 flex flex-col w-full lg:w-[410px] overflow-y-auto">
            <img src="${data.photoUrl}" alt="${data.title}" class="w-full h-auto object-cover flex-none">
            <div class="p-4 flex flex-col flex-grow relative">
                <h3 class="text-xl font-bold text-gray-800 mb-1">${data.title}</h3>
                <p class="text-gray-600 text-base mb-1">${dateEvent}</p>
                <p class="text-gray-700 leading-relaxed text-base">
                    ${data.description}
                </p>
            </div>
        </div>
    `;
}

function updateNavButtons() {
    if (!prevBtn || !nextBtn || !wallOfFameContainer) return;
    
    // Hide 'previous' button if at the start
    prevBtn.style.display = wallOfFameContainer.scrollLeft > 0 ? 'flex' : 'none';
    
    // Hide 'next' button if at the end
    const maxScroll = wallOfFameContainer.scrollWidth - wallOfFameContainer.clientWidth;
    nextBtn.style.display = wallOfFameContainer.scrollLeft < maxScroll - 1 ? 'flex' : 'none';
}

function setupWallOfFameListener() {
    if (!wallOfFameContainer) {
        console.error("Wall of Fame container not found!");
        return;
    }

    console.log("Setting up Wall of Fame listener...");
    const wallOfFameCollectionRef = collection(db, `artifacts/${appId}/public/data/walloffame`);
    const q = query(wallOfFameCollectionRef, orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        console.log("Wall of Fame listener triggered. Checking data...");
        
        if (snapshot.empty) {
            wallOfFameContainer.innerHTML = `<p class="text-center text-gray-500 text-xl mt-12">No achievements to display yet.</p>`;
            return;
        }

        console.log(`Found ${snapshot.size} achievement(s).`);
        wallOfFameContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const cardHtml = createWallOfFameCard(data);
            wallOfFameContainer.innerHTML += cardHtml;
        });
        console.log("Wall of Fame cards rendered.");

        // Add event listeners for navigation buttons after content is loaded
        if (prevBtn && nextBtn) {
            const scrollStep = 340; // Card width (300px) + gap (16px)
            prevBtn.onclick = () => {
                wallOfFameContainer.scrollBy({
                    left: -scrollStep,
                    behavior: 'smooth'
                });
            };
            nextBtn.onclick = () => {
                wallOfFameContainer.scrollBy({
                    left: scrollStep,
                    behavior: 'smooth'
                });
            };
            
            // Initial check and update on scroll
            wallOfFameContainer.onscroll = updateNavButtons;
            setTimeout(updateNavButtons, 300); // Small delay to allow rendering
        }
    }, (error) => {
        console.error("Error fetching Wall of Fame data:", error);
        wallOfFameContainer.innerHTML = `<p class="text-center text-red-500 text-xl mt-12">Failed to load achievements. Please try again later.</p>`;
    });
}

// Start the process by setting up the listener when the page loads
document.addEventListener('DOMContentLoaded', setupWallOfFameListener);
