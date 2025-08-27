// This script contains the logic for the events management section, including
// displaying events and handling the add/edit form.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Your Firebase config - this should match the config in admin-main.js
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// DOM elements specific to the Events section
const eventsList = document.getElementById('events-list');
const addEventBtn = document.getElementById('add-event-btn');
const eventFormContainer = document.getElementById('event-form-container');
const eventForm = document.getElementById('event-form');
const formTitle = document.getElementById('form-title');
const eventMessage = document.getElementById('event-message');
const cancelEventBtn = document.getElementById('cancel-event-btn');

const mediaTypeRadios = document.querySelectorAll('input[name="mediaType"]');
const imageUploadContainer = document.getElementById('image-upload-container');
const videoUrlContainer = document.getElementById('video-url-container');
const mediaFileInput = document.getElementById('media-file-input');
const videoUrlInput = document.getElementById('video-url-input');
const imagePreview = document.getElementById('image-preview');

const confirmationModal = document.getElementById('confirmation-modal');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

let currentEventId = null;
let eventToDeleteId = null;

// Helper function to show and hide message
function showMessage(message, type = 'success') {
    eventMessage.textContent = message;
    eventMessage.classList.remove('hidden');
    if (type === 'success') {
        eventMessage.classList.add('bg-green-100', 'text-green-800');
        eventMessage.classList.remove('bg-red-100', 'text-red-800');
    } else {
        eventMessage.classList.add('bg-red-100', 'text-red-800');
        eventMessage.classList.remove('bg-green-100', 'text-green-800');
    }
    setTimeout(() => {
        eventMessage.classList.add('hidden');
    }, 5000);
}

// Function to reset the form
function resetForm() {
    eventForm.reset();
    currentEventId = null;
    formTitle.textContent = 'Add Event';
    imagePreview.classList.add('hidden');
    imagePreview.querySelector('img').src = '';
    imageUploadContainer.classList.remove('hidden');
    videoUrlContainer.classList.add('hidden');
}

// Function to toggle the visibility of the form and list
function toggleForm(show = true) {
    eventFormContainer.classList.toggle('hidden', !show);
    eventsList.parentElement.classList.toggle('hidden', show);
}

// Function to render events as cards
function renderEvent(doc) {
    const event = doc.data();
    const eventId = doc.id;
    const eventCard = document.createElement('div');
    eventCard.id = `event-${eventId}`;
    eventCard.classList.add('bg-gray-100', 'rounded-lg', 'p-4', 'shadow-md');
    
    // Determine the content based on media type
    let mediaHtml = '';
    if (event.mediaType === 'image' && event.mediaUrl) {
        mediaHtml = `<img src="${event.mediaUrl}" alt="${event.title}" class="w-full h-48 object-cover rounded-md mb-4">`;
    } else if (event.mediaType === 'video' && event.mediaUrl) {
        const videoId = event.mediaUrl.split('v=')[1];
        mediaHtml = `<div class="aspect-w-16 aspect-h-9"><iframe class="w-full h-full rounded-md" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
    }

    eventCard.innerHTML = `
        ${mediaHtml}
        <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
        <p class="text-sm text-gray-600">${event.date}</p>
        <p class="text-sm text-gray-600 mb-4">${event.location}</p>
        <div class="flex space-x-2">
            <button data-id="${eventId}" class="edit-btn bg-yellow-500 text-white py-1 px-3 rounded-full text-sm hover:bg-yellow-600 transition-colors">Edit</button>
            <button data-id="${eventId}" class="delete-btn bg-red-500 text-white py-1 px-3 rounded-full text-sm hover:bg-red-600 transition-colors">Delete</button>
        </div>
    `;
    eventsList.appendChild(eventCard);
}

// Attach event listeners after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    // Listen for events from Firestore in real-time
    onSnapshot(collection(db, "events"), (querySnapshot) => {
        eventsList.innerHTML = '';
        querySnapshot.forEach(renderEvent);
        console.log('[DEBUG] Events list has been updated in real-time.');
    });

    // Event listener for the "Add New Event" button
    addEventBtn.addEventListener('click', () => {
        resetForm();
        toggleForm(true);
    });

    // Event listener for the "Cancel" button
    cancelEventBtn.addEventListener('click', () => {
        resetForm();
        toggleForm(false);
    });

    // Event listeners for Edit and Delete buttons on the event cards
    eventsList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('edit-btn')) {
            const eventId = target.dataset.id;
            editEvent(eventId);
        } else if (target.classList.contains('delete-btn')) {
            eventToDeleteId = target.dataset.id;
            confirmationModal.classList.remove('hidden');
        }
    });

    // Event listeners for the confirmation modal
    modalCancelBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
    });

    modalConfirmBtn.addEventListener('click', () => {
        if (eventToDeleteId) {
            deleteEvent(eventToDeleteId);
            confirmationModal.classList.add('hidden');
            eventToDeleteId = null;
        }
    });

    // Event listener for media type radio buttons
    mediaTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'image') {
                imageUploadContainer.classList.remove('hidden');
                videoUrlContainer.classList.add('hidden');
                videoUrlInput.removeAttribute('required');
                mediaFileInput.setAttribute('required', 'required');
            } else {
                imageUploadContainer.classList.add('hidden');
                videoUrlContainer.classList.remove('hidden');
                mediaFileInput.removeAttribute('required');
                videoUrlInput.setAttribute('required', 'required');
            }
        });
    });

    // Event listener for image file input to show preview
    mediaFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.querySelector('img').src = event.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Event form submission
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const eventTitle = document.getElementById('event-title').value;
        const eventDate = document.getElementById('event-date').value;
        const eventLocation = document.getElementById('event-location').value;
        const eventDescription = document.getElementById('event-description').value;
        const approved = document.getElementById('event-approved').checked;
        const mediaType = document.querySelector('input[name="mediaType"]:checked').value;
        
        let mediaUrl = '';
        let oldImageUrl = '';
        
        try {
            if (mediaType === 'image') {
                const file = mediaFileInput.files[0];
                if (file) {
                    const storageRef = ref(storage, `events/${Date.now()}-${file.name}`);
                    const uploadTask = await uploadBytes(storageRef, file);
                    mediaUrl = await getDownloadURL(uploadTask.ref);
                } else if (currentEventId) {
                    const docSnap = await getDoc(doc(db, "events", currentEventId));
                    if (docSnap.exists()) {
                        oldImageUrl = docSnap.data().mediaUrl;
                        mediaUrl = oldImageUrl;
                    }
                }
            } else {
                mediaUrl = videoUrlInput.value;
            }

            const eventData = {
                title: eventTitle,
                date: eventDate,
                location: eventLocation,
                description: eventDescription,
                approved: approved,
                mediaType: mediaType,
                mediaUrl: mediaUrl
            };

            if (currentEventId) {
                // Update existing event
                const eventRef = doc(db, "events", currentEventId);
                await updateDoc(eventRef, eventData);
                showMessage('Event updated successfully!');
            } else {
                // Add new event
                await addDoc(collection(db, "events"), eventData);
                showMessage('Event added successfully!');
            }
            
            resetForm();
            toggleForm(false);
            
        } catch (error) {
            console.error("Error adding/updating event:", error);
            showMessage('Error saving event. Please try again.', 'error');
        }
    });

    // Populate the form for editing
    async function editEvent(eventId) {
        try {
            const docSnap = await getDoc(doc(db, "events", eventId));
            if (docSnap.exists()) {
                const event = docSnap.data();
                currentEventId = docSnap.id;
                formTitle.textContent = 'Edit Event';
                
                document.getElementById('event-title').value = event.title;
                document.getElementById('event-date').value = event.date;
                document.getElementById('event-location').value = event.location;
                document.getElementById('event-description').value = event.description;
                document.getElementById('event-approved').checked = event.approved;
                
                if (event.mediaType === 'image') {
                    document.querySelector('input[name="mediaType"][value="image"]').checked = true;
                    imageUploadContainer.classList.remove('hidden');
                    videoUrlContainer.classList.add('hidden');
                    if (event.mediaUrl) {
                        imagePreview.querySelector('img').src = event.mediaUrl;
                        imagePreview.classList.remove('hidden');
                    }
                } else {
                    document.querySelector('input[name="mediaType"][value="video"]').checked = true;
                    imageUploadContainer.classList.add('hidden');
                    videoUrlContainer.classList.remove('hidden');
                    videoUrlInput.value = event.mediaUrl;
                }
                
                toggleForm(true);
            }
        } catch (error) {
            console.error("Error fetching event for edit:", error);
            showMessage('Error loading event for editing.', 'error');
        }
    }

    // Function to delete an event
    async function deleteEvent(eventId) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            showMessage('Event deleted successfully!');
        } catch (error) {
            console.error("Error deleting event:", error);
            showMessage('Error deleting event. Please try again.', 'error');
        }
    }

});
