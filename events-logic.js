// events-logic.js

// Import Firebase SDKs
// The version is specified to ensure stability.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// --- Global variables from the canvas environment ---
// DO NOT change these variables. The Canvas platform automatically provides the
// Firebase configuration and app ID at runtime. This is the correct way
// to initialize Firebase within this environment to avoid configuration errors.
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : {};

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

// Initialize Firebase
const appId = "nalandachessacademy-474db";

// Check if Firebase config is valid before initializing
if (!firebaseConfig.projectId) {
    console.error("Firebase 'projectId' is missing. The platform's global variables may not be available. Please check your environment or try again later.");
    document.addEventListener('DOMContentLoaded', () => {
        const eventsContainer = document.getElementById('events-container');
        if (eventsContainer) {
            eventsContainer.innerHTML = `
                <div class="text-center text-red-600 p-8 rounded-lg shadow-md bg-white mt-8">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h2 class="text-xl font-bold">Failed to load events.</h2>
                    <p class="text-gray-700 mt-2">The application's Firebase configuration is not available. Please try again later.</p>
                </div>
            `;
        }
    });
} else {
    // --- Initialize Firebase services ---
    // The Firebase configuration is now correctly parsed.
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // --- DOM Elements ---
    // Caching these elements is crucial for performance.
    const eventsContainer = document.getElementById('events-container');
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const prevImageBtn = document.getElementById('prev-image-btn');
    const nextImageBtn = document.getElementById('next-image-btn');

    /**
     * Renders an individual event card to the page.
     * This version assumes mediaUrl is a direct link to an image.
     * @param {Object} event - The event data object from Firestore.
     */
    async function renderEvent(event) {
        const eventCard = document.createElement('div');
        eventCard.classList.add('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden', 'p-6', 'flex', 'flex-col', 'md:flex-row', 'md:space-x-6');

        // The mediaUrl is now a direct link to the image.
        const imageUrl = event.mediaUrl || 'https://placehold.co/400x300/e2e8f0/000000?text=No+Image';

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('mb-4', 'md:mb-0', 'md:w-1/3', 'flex-shrink-0', 'w-full', 'aspect-video', 'bg-gray-200', 'rounded-md', 'flex', 'items-center', 'justify-center', 'text-gray-500', 'text-sm', 'cursor-pointer', 'thumbnail-image');
        
        imageContainer.innerHTML = `<img src="${imageUrl}" alt="${event.eventName}" class="w-full h-full object-cover rounded-md">`;
        
        // Event details container
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('md:w-2/3');
        detailsContainer.innerHTML = `
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${event.eventName}</h3>
            <p class="text-gray-600 mb-1"><i class="far fa-calendar-alt mr-2"></i><strong>Date:</strong> ${event.eventDate}</p>
            <p class="text-gray-600 mb-1"><i class="fas fa-map-marker-alt mr-2"></i><strong>Location:</strong> ${event.eventLocation}</p>
            <p class="text-gray-700 mt-4">${event.eventDetails}</p>
        `;

        // Reassemble the card with the updated content.
        eventCard.appendChild(imageContainer);
        eventCard.appendChild(detailsContainer);
        eventsContainer.appendChild(eventCard);
    }

    /**
     * Toggles the visibility of the image modal with a fade-in/out effect.
     * @param {boolean} show - Whether to show or hide the modal.
     */
    function toggleModal(show) {
        if (show) {
            imageModal.classList.remove('hidden', 'opacity-0');
            imageModal.classList.add('opacity-100');
        } else {
            imageModal.classList.remove('opacity-100');
            imageModal.classList.add('opacity-0');
            setTimeout(() => imageModal.classList.add('hidden'), 300);
        }
    }

    // --- Main execution block ---
    document.addEventListener('DOMContentLoaded', () => {
        // Set up a real-time listener for the events collection.
        const eventsCollectionRef = collection(db, `artifacts/${appId}/public/data/events`);
        console.log(`[DEBUG] Events collection path: ${eventsCollectionRef.path}`);
        const eventsQuery = query(eventsCollectionRef);

        onSnapshot(eventsQuery, (querySnapshot) => {
            // Clear existing events to prevent duplicates.
            eventsContainer.innerHTML = '';
            if (querySnapshot.empty) {
                eventsContainer.innerHTML = '<p class="text-center text-gray-500 mt-8">No events found.</p>';
            } else {
                querySnapshot.docs.forEach(doc => renderEvent(doc.data()));
                console.log(`[DEBUG] Events list has been updated with ${querySnapshot.size} events.`);
            }
        }, (error) => {
            console.error("Error fetching events:", error);
            eventsContainer.innerHTML = `
                <div class="text-center text-red-600 p-8 rounded-lg shadow-md bg-white mt-8">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h2 class="text-xl font-bold">Failed to load events.</h2>
                    <p class="text-gray-700 mt-2">There might be an issue connecting to the database or a security rule is blocking access.</p>
                </div>
            `;
        });

        // --- Event Listeners for Interaction ---
        // Handle clicks on image thumbnails to open the modal.
        eventsContainer.addEventListener('click', (e) => {
            const thumbnail = e.target.closest('.thumbnail-image');
            if (thumbnail) {
                const imageUrl = thumbnail.querySelector('img').src;
                modalImage.src = imageUrl;
                toggleModal(true);
            }
        });

        // The navigation buttons are not needed for a single image, so they are not handled.
        // Close modal.
        closeModalBtn.addEventListener('click', () => {
            toggleModal(false);
        });

        // Close modal on outside click.
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                toggleModal(false);
            }
        });
    });
}
