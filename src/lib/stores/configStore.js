import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Default settings
const defaultConfig = {
	apiBaseUrl: 'http://localhost:3000',
	websocketUrl: 'http://localhost:3000',
	fileServer: 'http://localhost:3000/videos/'
};

// Function to safely load configuration from localStorage
function loadConfig() {
	if (browser) {
		try {
			const savedConfig = localStorage.getItem('backendConfig');
			if (savedConfig) {
				console.log('Loaded configStore from localStorage. ', savedConfig);

				return JSON.parse(savedConfig);
			}
		} catch (error) {
			console.error('Failed to load configuration from localStorage:', error);
		}
	}
	// Return the default configuration if localStorage is empty or invalid
	return defaultConfig;
}

// Load saved configuration from localStorage (only in the browser)
const savedConfig = loadConfig();

// Create a writable store with the saved configuration
export const configStore = writable(savedConfig);

// Automatically save the store's state to localStorage whenever it changes
if (browser) {
	configStore.subscribe((currentConfig) => {
		console.log('Updating configStore...');
		try {
			localStorage.setItem('backendConfig', JSON.stringify(currentConfig));
		} catch (error) {
			console.error('Failed to save configuration to localStorage:', error);
		}
	});
}
