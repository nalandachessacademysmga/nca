// This script is specifically for initializing the Jitsi Meet iframe.
console.log('[DEBUG] admin-confcall-logic.js script is now executing.');

// Check if the Jitsi API is already available on the window object.
if (window.JitsiMeetExternalAPI) {
    console.log('[DEBUG] JitsiMeetExternalAPI is already available. Initializing iframe...');
    const api = new JitsiMeetExternalAPI("8x8.vc", {
        roomName: "vpaas-magic-cookie-9ba8c5498bf5496c95f1005fd25f4d51/SampleAppOperationalCoachesBillSelfishly",
        parentNode: document.querySelector('#jaas-container'),
        // Make sure to include a JWT if you intend to record,
        // make outbound calls or use any other premium features!
        // jwt: "null"
    });
    console.log('[DEBUG] Jitsi API initialized successfully.');
} else {
    // If the Jitsi API is not yet available, we need to load it.
    console.log('[DEBUG] JitsiMeetExternalAPI not found. Loading script...');
    const jitsiScript = document.createElement('script');
    jitsiScript.src = 'https://8x8.vc/vpaas-magic-cookie-9ba8c5498bf5496c95f1005fd25f4d51/external_api.js';
    jitsiScript.async = true;
    document.head.appendChild(jitsiScript);

    jitsiScript.onload = () => {
        console.log('[DEBUG] JitsiMeetExternalAPI script loaded. Initializing...');
        
        // We use a simple polling loop to wait for the API to be available.
        const checkJitsiApi = setInterval(() => {
            if (window.JitsiMeetExternalAPI) {
                clearInterval(checkJitsiApi);
                console.log('[DEBUG] JitsiMeetExternalAPI is available. Initializing iframe...');
                
                const api = new JitsiMeetExternalAPI("8x8.vc", {
                    roomName: "vpaas-magic-cookie-9ba8c5498bf5496c95f1005fd25f4d51/SampleAppOperationalCoachesBillSelfishly",
                    parentNode: document.querySelector('#jaas-container'),
                    // Make sure to include a JWT if you intend to record,
                    // make outbound calls or use any other premium features!
                    // jwt: "null"
                });
                console.log('[DEBUG] Jitsi API initialized successfully.');
            } else {
                console.log('[DEBUG] JitsiMeetExternalAPI not yet available, waiting...');
            }
        }, 500); // Check every 500ms
    };

    jitsiScript.onerror = (error) => {
        console.error('[DEBUG] Failed to load JitsiMeetExternalAPI script:', error);
    };
}
