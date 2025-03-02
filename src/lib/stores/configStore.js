import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Default settings
const defaultConfig = {
	apiBaseUrl: 'http://localhost:3000',
	websocketUrl: 'http://localhost:3000',
	fileServer: 'http://192.168.1.2:5173/videos/'
};

let isConfigLoaded = false;

// Function to safely load configuration from localStorage
function loadConfig() {
	if (browser && !isConfigLoaded) {
		try {
			const savedConfig = localStorage.getItem('backendConfig');
			if (savedConfig) {
				console.log('Loaded configStore from localStorage. ', savedConfig);
				isConfigLoaded = true;
				return JSON.parse(savedConfig);
			}
		} catch (error) {
			console.error('Failed to load configuration from localStorage:', error);
		}
	}
	console.log('Using default configuration.');
	return defaultConfig;
}

function getLocalStorageSize() {
	let totalSize = 0;

	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i); // Get the key at index `i`
			console.log(key);
			const value = localStorage.getItem(key); // Get the value for the key

			// Add the size of the key and value (in characters)
			totalSize += key.length + value.length;
		}
	} catch (error) {
		console.error('getLocalStorageSize()', error);
	}

	// Convert size to bytes (each character is approximately 1 byte in UTF-16)
	return totalSize;
}

// Load saved configuration from localStorage (only in the browser)
const savedConfig = loadConfig();
console.log('localstorage size:', getLocalStorageSize());

// Create a writable store with the saved configuration
export const configStore = writable(savedConfig);

// Automatically save the store's state to localStorage whenever it changes
if (browser) {
	configStore.subscribe((currentConfig) => {
		console.log('Updating configStore...', currentConfig);
		try {
			localStorage.setItem('backendConfig', JSON.stringify(currentConfig));
		} catch (error) {
			console.error('Failed to save configuration to localStorage:', error);
		}
	});
}
