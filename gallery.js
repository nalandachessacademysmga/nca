// gallery.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// --- Firebase Configuration ---
// Make sure this configuration matches your project's details
const firebaseConfig = {
    apiKey: "AIzaSyD86XmFYQOqli4BQsNQERh-kDTYeetAqqM",
    authDomain: "nalandachessacademy-474db.firebaseapp.com",
    projectId: "nalandachessacademy-474db",
    storageBucket: "nalandachessacademy-474db-7w9pw",
    messagingSenderId: "30847597506",
    appId: "1:30847597506:web:05c9013240835edee9745b",
    measurementId: "G-Z301KFQ12C"
};

// --- Global Variables ---
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const galleryContainer = document.getElementById('gallery-container');
let galleryImages = []; // Array to store image URLs
let currentImageIndex = 0;

// --- New Modal Functionality ---
/**
 * Creates and displays a full-screen image modal.
 * @param {number} index - The index of the image to display.
 */
function createImageModal(index) {
    if (document.getElementById('image-modal-overlay')) {
        return;
    }

    currentImageIndex = index;
    const imageUrl = galleryImagesIndexMap.get(index);

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'image-modal-overlay';
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-0 cursor-pointer';

    // Create the modal container
    const modalContent = document.createElement('div');
    modalContent.className = 'relative max-w-full max-h-full overflow-hidden flex items-center justify-center';
    modalContent.addEventListener('click', (e) => e.stopPropagation()); // Prevent closing on image click

    // Create the image element inside the modal
    const modalImage = document.createElement('img');
    modalImage.src = imageUrl;
    modalImage.className = 'max-w-full max-h-full object-contain';
    modalImage.alt = 'Full-screen gallery image';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full cursor-pointer hover:bg-opacity-70 focus:outline-none';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents click from bubbling to the overlay
        showPreviousImage();
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full cursor-pointer hover:bg-opacity-70 focus:outline-none';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents click from bubbling to the overlay
        showNextImage();
    });

    modalContent.appendChild(modalImage);
    modalOverlay.appendChild(modalContent);
    modalOverlay.appendChild(prevBtn);
    modalOverlay.appendChild(nextBtn);
    document.body.appendChild(modalOverlay);

    // Fade in the modal
    setTimeout(() => {
        modalOverlay.classList.remove('opacity-0');
    }, 10);

    // Function to close the modal
    const closeModal = () => {
        modalOverlay.classList.add('opacity-0');
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300); // Wait for the fade-out transition
    };

    modalOverlay.addEventListener('click', closeModal);

    // Close with the Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            closeModal();
        } else if (e.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        }
    });
}

function showPreviousImage() {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    const imageUrl = galleryImagesIndexMap.get(currentImageIndex);
    document.querySelector('#image-modal-overlay img').src = imageUrl;
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    const imageUrl = galleryImagesIndexMap.get(currentImageIndex);
    document.querySelector('#image-modal-overlay img').src = imageUrl;
}

// --- Core Gallery Loading Functionality ---
let galleryImagesIndexMap = new Map();

function LoadGalleryImages() {
    console.log("Debug: Starting image loading process.");

    const listRef = ref(storage, 'app_assets/gallery');
    console.log(`Debug: Targeting storage folder: ${listRef.fullPath}`);

    // List all items in the folder
    listAll(listRef)
        .then((res) => {
            console.log(`Debug: Found ${res.items.length} image(s) in the folder.`);
            if (res.items.length === 0) {
                galleryContainer.innerHTML = `<p class="text-center text-gray-500 text-xl mt-12">No gallery images to display yet.</p>`;
                return;
            }

            galleryImages = res.items; // Store the list of items
            galleryContainer.innerHTML = ''; // Clear existing content

            galleryImages.forEach((itemRef, index) => {
                console.log(`Debug: Processing image: ${itemRef.fullPath}`);
                getDownloadURL(itemRef)
                    .then((url) => {
                        console.log(`Debug: Successfully retrieved URL: ${url}`);
                        galleryImagesIndexMap.set(index, url); // Store URL with index
                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = itemRef.name;
                        img.className = 'w-full h-48 object-cover rounded-lg shadow-md transform transition-transform duration-300 hover:scale-105 cursor-pointer';

                        img.addEventListener('click', () => {
                            createImageModal(index);
                        });

                        galleryContainer.appendChild(img);
                    })
                    .catch((error) => {
                        console.error(`Error getting download URL for ${itemRef.fullPath}:`, error);
                    });
            });
        })
        .catch((error) => {
            console.error("Error listing items from storage:", error);
            galleryContainer.innerHTML = `<p class="text-center text-red-500 text-xl mt-12">Failed to load gallery images. Please check console for details.</p>`;
        });
}

// Start the process when the page loads
document.addEventListener('DOMContentLoaded', LoadGalleryImages);
