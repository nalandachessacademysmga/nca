// testimonials-display.js
// Functionality to display the Testimonial's carousel on the Home page.
// Import necessary Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
// Make sure this configuration matches the one in your admin-utility.html file.
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
const appId = "nalandachessacademy-474db"; // Replace with your actual appId if different
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements for the carousel
const carouselContainer = document.getElementById('testimonial-carousel-container');
const prevButton = document.getElementById('testimonial-prev-btn');
const nextButton = document.getElementById('testimonial-next-btn');

let testimonials = [];
let currentIndex = 0;

// --- Core Functionality ---

/**
 * Renders a single testimonial card based on the provided data.
 * @param {object} data - The testimonial object containing name, title, etc.
 * @returns {string} - The HTML string for the testimonial card.
 */
function createTestimonialCard(data) {
  return `
	  <div class="testimonial-card p-6 md:p-8 bg-radial-gradient rounded-xl shadow-lg flex flex-col justify-between w-full flex-shrink-0 snap-center">
          <i class="fas fa-quote-left text-purple-400 text-3xl mb-4"></i>
          
          <p class="text-lg md:text-xl italic text-gray-900 leading-relaxed">
              "${data.testimonial}"
          </p>
          
          <div class="flex items-center mt-6">
              <img src="${data.photoUrl}" alt="${data.name}" class="w-16 h-16 rounded-full object-cover border-2 border-purple-500 mr-4">
              <div>
                  <p class="font-bold text-gray-900 text-lg">${data.name}</p>
                  <p class="text-sm text-gray-900">${data.title}</p>
              </div>
          </div>
      </div>	  
  `;
}

/**
 * Updates the carousel UI to show the testimonial at the current index.
 */
function updateCarouselDisplay() {
  if (testimonials.length === 0) {
    carouselContainer.innerHTML = `<p class="text-center text-gray-500">No testimonials to display yet.</p>`;
    // No need to hide or disable buttons here, as they'll remain on the page.
    return;
  }

  // Clear the container before re-rendering the cards
  carouselContainer.innerHTML = '';
  
  // Render all testimonials and add them to the container
  testimonials.forEach((testimonial, index) => {
    const cardHtml = createTestimonialCard(testimonial);
    carouselContainer.innerHTML += cardHtml;
  });

  // Get the newly created cards and handle visibility
  const cards = document.querySelectorAll('#testimonial-carousel-container .testimonial-card');
  cards.forEach((card, index) => {
    if (index === currentIndex) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
  
  // No need to update button visibility as they will always be enabled
}

/**
 * Handles the "next" button click event, cycling through testimonials.
 */
function showNextTestimonial() {
  if (testimonials.length > 0) {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateCarouselDisplay();
  }
}

/**
 * Handles the "previous" button click event, cycling through testimonials.
 */
function showPrevTestimonial() {
  if (testimonials.length > 0) {
    currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    updateCarouselDisplay();
  }
}

// --- Main Execution Logic ---

/**
 * Fetches testimonials from Firestore and sets up a real-time listener.
 * This function will automatically update the UI whenever data changes.
 */
function setupTestimonialsListener() {
    console.log("Setting up testimonials listener...");
    const testimonialsCollectionRef = collection(db, `artifacts/${appId}/public/data/testimonials`);
    console.log("Testimonials collection reference:", testimonialsCollectionRef);
    
    const q = query(testimonialsCollectionRef, orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        console.log("onSnapshot listener triggered. Checking data...");
        testimonials = [];

        // Check if the snapshot is empty
        if (snapshot.empty) {
            console.log("Snapshot is empty. No documents found.");
            updateCarouselDisplay();
            return;
        }

        console.log(`Found ${snapshot.size} document(s).`);
        snapshot.forEach(doc => {
            const testimonialData = doc.data();
            console.log("Document ID:", doc.id);
            console.log("Document Data:", testimonialData);
            testimonials.push({ id: doc.id, ...testimonialData });
        });
        
        console.log("Final testimonials array:", testimonials);

        // Reset index to the first testimonial and update the display
        currentIndex = 0;
        updateCarouselDisplay();

    }, (error) => {
        console.error("Error fetching testimonials:", error);
        if (carouselContainer) {
            carouselContainer.innerHTML = `<p class="text-center text-red-500">Failed to load testimonials. Please try again later.</p>`;
        }
    });
}

// Attach event listeners to carousel buttons
if (prevButton && nextButton) {
    prevButton.addEventListener('click', showPrevTestimonial);
    nextButton.addEventListener('click', showNextTestimonial);
}

// Start the process by setting up the listener
document.addEventListener('DOMContentLoaded', setupTestimonialsListener);
