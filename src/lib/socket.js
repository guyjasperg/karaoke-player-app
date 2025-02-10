// src/lib/socket.js
import { writable } from 'svelte/store';
import { io } from 'socket.io-client';
import { configStore } from './stores/configStore';
import { nonpassive } from 'svelte/legacy';

//current storeConfig
let config;
let socket;
let isInitialized = false;

// Subscribe to the config store
configStore.subscribe((value) => {
	console.log('configStore.subscribe()');
	config = value;
	// console.log('Current configuration:', value);
	console.log('fileServer: ', config.fileServer);
});

// Create a writable store to hold messages
export const messages = writable([]);

export function getSocket(url) {
	if (!socket) {
		// Initialize the socket with reconnection options
		socket = io(url, {
			reconnection: true, // Enable automatic reconnection
			reconnectionAttempts: Infinity, // Retry indefinitely
			reconnectionDelay: 1000, // Wait 1 second before retrying
			reconnectionDelayMax: 5000, // Maximum delay between retries
			timeout: 10000 // Timeout for connection attempts
		});

		// Log connection events for debugging
		socket.on('connect', () => {
			console.log('socket.io: Connected to server');
		});

		socket.on('disconnect', () => {
			console.log('socket.io: Disconnected from server');
		});

		// // Listen for incoming messages
		socket.on('message', (message) => {
			console.log(`socket.io: message received: ${message}`);
			messages.update((currentMessages) => [...currentMessages, message]);
		});

		socket.on('songQueueUpdated', (data) => {
			// const msg = JSON.stringify(message);

			console.log('songQueueUpdated()', data.action, data.sessionID);

			//only add song if it is for the current session
			// messages.update((currentMessages) => [...currentMessages, data]);
		});

		socket.on('reconnect', (attemptNumber) => {
			console.log(`socket.io: Reconnected after ${attemptNumber} attempts`);
		});

		socket.on('reconnect_error', (error) => {
			console.error('socket.io: Reconnection error:', error);
		});
	}

	return socket;
}

export function disconnectSocket() {
	console.error('socket.io: disconnectSocket()');
	if (socket) {
		socket.disconnect();
		socket = null; // Reset the socket instance
	}
}

function initializeSocket(url) {
	// Connect to the Socket.IO server
	console.log('initializeSocket', url);
	socket = io(url); // Replace with your server URL
	isInitialized = true;
}

// socket.on('connect', () => {
// 	console.log('socket.io: Connected to server');
// });

// socket.on('disconnect', () => {
// 	console.log('socket.io: Disconnected from server');
// });

// socket.on('reconnect', () => {
// 	console.log('socket.io: Reconnected to server');
// });

// // Listen for incoming messages
// socket.on('message', (message) => {
// 	console.log(`message received: ${message}`);
// 	messages.update((currentMessages) => [...currentMessages, message]);
// });

// socket.on('songQueueUpdated', (data) => {
// 	// const msg = JSON.stringify(message);

// 	console.log('song added to queue: ', data);
// 	console.log('action: ', data.action);
// 	console.log('sessionId: ', data.sessionID);
// 	console.log('song: ', data.song);

// 	//only add song if it is for the current session

// 	messages.update((currentMessages) => [...currentMessages, data]);
// });

// Function to send a message
export function sendMessage(message) {
	console.log(`sending message: ${message}`);
	socket.emit('message', message);
}

// Export the socket instance if needed
// export { socket };
