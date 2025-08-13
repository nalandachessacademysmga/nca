// admin-testimonial.js

import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// DOM elements from admin-utility.html
const testimonialForm = document.getElementById('testimonial-form');
console.log("Form element found:", testimonialForm);
const testimonialsList = document.getElementById('testimonials-list');
const testimonialNameInput = document.getElementById('testimonial-name');
const testimonialTitleInput = document.getElementById('testimonial-title');
const testimonialTextInput = document.getElementById('testimonial-text'); 
const testimonialPriorityInput = document.getElementById('testimonial-priority');
const testimonialPhotoFile = document.getElementById('testimonial-photo-file');
const submitTestimonialBtn = document.getElementById('submit-testimonial-btn');
const cancelTestimonialEditBtn = document.getElementById('cancel-testimonial-edit-btn');
const testimonialFormMessage = document.getElementById('testimonial-form-message');

// Modal functions passed from main utility file
let showAlert, showConfirmation;

// State variables
let isTestimonialEditMode = false;
let currentTestimonialEditDocId = null;
let db, storage, appId, currentUserRole;

// --- Helper Functions (Private to this module) ---

function createTestimonialCard(id, data, currentUserRole) {
    const card = document.createElement('div');
    card.className = "bg-white rounded-lg shadow-xl overflow-hidden p-6";

    const cardContent = `
        <img src="${data.photoUrl}" alt="Photo of ${data.name}" class="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-purple-500">
        <blockquote class="text-center italic text-gray-700 mb-4">"${data.testimonial}"</blockquote>
        <p class="font-bold text-gray-900 text-center">${data.name}</p>
        <p class="text-sm text-gray-600 text-center">${data.title}</p>
        <div class="flex justify-between items-center text-xs text-gray-500 mt-4">
            <span>Priority: ${data.priority}</span>
            <span>ID: ${id}</span>
        </div>
        <div class="mt-4 flex space-x-2 justify-center">
            ${(currentUserRole === 'admin' || currentUserRole === 'editor') ? `
                <button data-id="${id}" class="edit-testimonial-btn bg-yellow-500 text-white font-semibold py-2 px-4 rounded-full text-xs hover:bg-yellow-600">Edit</button>
            ` : ''}
            ${currentUserRole === 'admin' ? `
                <button data-id="${id}" data-photo-url="${data.photoUrl}" class="delete-testimonial-btn bg-red-500 text-white font-semibold py-2 px-4 rounded-full text-xs hover:bg-red-600">Delete</button>
            ` : ''}
        </div>
    `;
    card.innerHTML = cardContent;

    if (currentUserRole === 'admin' || currentUserRole === 'editor') {
        card.querySelector('.edit-testimonial-btn')?.addEventListener('click', (e) => editTestimonial(e.target.dataset.id, data));
    }
    if (currentUserRole === 'admin') {
        card.querySelector('.delete-testimonial-btn')?.addEventListener('click', (e) => deleteTestimonial(e.target.dataset.id, e.target.dataset.photoUrl));
    }
    
    return card;
}

function resetTestimonialForm() {
    testimonialForm.reset();
    isTestimonialEditMode = false;
    currentTestimonialEditDocId = null;
    submitTestimonialBtn.textContent = 'Add Testimonial';
    cancelTestimonialEditBtn.classList.add('hidden');
    testimonialFormMessage.classList.add('hidden');
    console.log("Form reset. Ready for new testimonial entry.");
}

async function editTestimonial(docId, data) {
    isTestimonialEditMode = true;
    currentTestimonialEditDocId = docId;
    testimonialNameInput.value = data.name;
    testimonialTitleInput.value = data.title;
    testimonialTextInput.value = data.testimonial; 
    testimonialPriorityInput.value = data.priority;
    
    submitTestimonialBtn.textContent = 'Update Testimonial';
    cancelTestimonialEditBtn.classList.remove('hidden');
    
    testimonialForm.scrollIntoView({ behavior: 'smooth' });
    console.log(`Editing testimonial with ID: ${docId}`);
}

async function deleteTestimonial(docId, photoUrl) {
    console.log(`Attempting to delete testimonial with ID: ${docId}`);
    const confirmed = await showConfirmation('Are you sure you want to delete this testimonial?');
    if (!confirmed) return;
    
    try {
        if (photoUrl) {
            console.log("Deleting photo from storage:", photoUrl);
            const photoRef = ref(storage, photoUrl);
            await deleteObject(photoRef);
        }
        
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/testimonials/${docId}`));
        
        showAlert("Testimonial deleted successfully!");
        console.log("Testimonial deletion successful.");
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        showAlert("An error occurred while deleting.");
    }
}

async function handleTestimonialFormSubmit(e) {
    e.preventDefault();
    console.log("Testimonial form submitted.");

    testimonialFormMessage.classList.add('hidden');

    const name = testimonialNameInput.value;
    const title = testimonialTitleInput.value;
    const testimonial = testimonialTextInput.value; // Updated field
    const priority = parseInt(testimonialPriorityInput.value, 10);
    const photoFile = testimonialPhotoFile.files[0];

    console.log("Form data captured:", { name, title, testimonial, priority, photoFile: photoFile ? photoFile.name : 'No file' });

    if (!name || !title || !testimonial) {
        showAlert("Please fill in all required fields.");
        return;
    }
    if (!photoFile && !isTestimonialEditMode) {
        showAlert("Please select a photo to upload.");
        return;
    }

    submitTestimonialBtn.disabled = true;
    submitTestimonialBtn.textContent = isTestimonialEditMode ? 'Updating...' : 'Adding...';

    try {
        let photoUrl;
        if (photoFile) {
            console.log("Uploading new photo to storage...");
            const storageRef = ref(storage, `testimonials/${Date.now()}-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            photoUrl = await getDownloadURL(storageRef);
            console.log("Photo upload complete. URL:", photoUrl);
        } else if (isTestimonialEditMode) {
            console.log("No new photo selected. Retaining existing photo URL.");
            const existingDoc = await getDoc(doc(db, `artifacts/${appId}/public/data/testimonials/${currentTestimonialEditDocId}`));
            photoUrl = existingDoc.data().photoUrl;
        }

        const newTestimonial = {
            name,
            title,
            testimonial,
            priority: isNaN(priority) ? 0 : priority,
            photoUrl,
            timestamp: Date.now()
        };

        console.log("Final testimonial data to be saved:", newTestimonial);

        const docRef = isTestimonialEditMode
            ? doc(db, `artifacts/${appId}/public/data/testimonials/${currentTestimonialEditDocId}`)
            : doc(collection(db, `artifacts/${appId}/public/data/testimonials`));
        
        await setDoc(docRef, newTestimonial);

        showAlert(isTestimonialEditMode ? "Testimonial updated successfully!" : "Testimonial added successfully!");
        resetTestimonialForm();

    } catch (error) {
        console.error("Error adding/updating testimonial:", error);
        showAlert("An error occurred. Please try again.");
    } finally {
        submitTestimonialBtn.disabled = false;
        submitTestimonialBtn.textContent = 'Add Testimonial';
    }
}

// --- Main Initialization Function (The public API for this module) ---

export function initializeTestimonialsAdmin(dbInstance, storageInstance, appIdentifier, userRole, alertFunc, confirmFunc) {
    // Set the module-level variables with the provided instances and functions
    db = dbInstance;
    storage = storageInstance;
    appId = appIdentifier;
    currentUserRole = userRole;
    showAlert = alertFunc;
    showConfirmation = confirmFunc;

    // Set up the real-time listener for testimonials
    console.log("Initializing Testimonials Admin module.");
    const testimonialsRef = collection(db, `artifacts/${appId}/public/data/testimonials`);
    onSnapshot(testimonialsRef, (snapshot) => {
        console.log("onSnapshot listener triggered for testimonials admin list.");
        const testimonials = [];
        snapshot.forEach(doc => {
            testimonials.push({ id: doc.id, ...doc.data() });
        });

        testimonials.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return b.timestamp - a.timestamp;
        });
        
        testimonialsList.innerHTML = '';
        testimonials.forEach(data => {
            const testimonialCard = createTestimonialCard(data.id, data, currentUserRole);
            testimonialsList.appendChild(testimonialCard);
        });
        console.log(`Admin list updated. Found ${testimonials.length} testimonials.`);
    }, (error) => {
        console.error("Error fetching testimonials:", error);
        showAlert('Failed to load testimonials.');
    });

    // Attach event listeners to the form and buttons
    testimonialForm.addEventListener('submit', handleTestimonialFormSubmit);
    cancelTestimonialEditBtn.addEventListener('click', resetTestimonialForm);
}