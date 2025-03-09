import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Default settings
const defaultConfig = {
	apiBaseUrl: 'http://localhost:3000',
	websocketUrl: 'http://localhost:3000',
	fileServer: 'http://192.168.1.2:5173/videos/'
};

// Create the base store with default config
const { subscribe, set, update } = writable(defaultConfig);

// Keep track of initialization state
let initializationPromise = null;

// Helper function to get config file path
async function getConfigPath() {
	if (!browser) {
		const path = await import('path');
		return path.join(process.cwd(), 'config.json');
	}
	return null;
}

// Initialize server-side components
async function initializeServer() {
	if (!browser) {
		const fs = await import('fs');
		const CONFIG_FILE = await getConfigPath();

		try {
			console.log('Attempting to load config from:', CONFIG_FILE);
			if (fs.existsSync(CONFIG_FILE)) {
				const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
				console.log('Loaded config from file:', fileContent);
				const config = JSON.parse(fileContent);
				set(config);
				return config;
			} else {
				console.log('Config file does not exist, creating with default config');
				// Ensure directory exists
				fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
				console.log('Created config file with default settings');
			}
		} catch (error) {
			console.error('Failed to load/create config file:', error);
		}
	}
	return defaultConfig;
}

// Initialize browser-side components
function initializeBrowser() {
	if (browser) {
		try {
			const saved = localStorage.getItem('backendConfig');
			if (saved) {
				console.log('Loaded config from localStorage:', saved);
				const config = JSON.parse(saved);
				set(config);
				return config;
			}
		} catch (error) {
			console.error('Failed to load config from localStorage:', error);
		}
	}
	return defaultConfig;
}

// Initialize the store based on environment
if (browser) {
	initializationPromise = Promise.resolve(initializeBrowser());
} else {
	initializationPromise = initializeServer();
}

// Create the store interface
const configStore = {
	subscribe,
	set: async (value) => {
		console.log('Setting new config value:', value);
		if (browser) {
			localStorage.setItem('backendConfig', JSON.stringify(value));
			console.log('Saved config to localStorage:', value);
		} else {
			try {
				const fs = await import('fs');
				const CONFIG_FILE = await getConfigPath();
				console.log('Saving config to file:', CONFIG_FILE, value);
				fs.writeFileSync(CONFIG_FILE, JSON.stringify(value, null, 2));
				console.log('Successfully saved config to file');
			} catch (error) {
				console.error('Failed to save config to file:', error);
			}
		}
		set(value);
	},
	update: async (updater) => {
		const currentValue = await initializationPromise; // Ensure we have the latest value
		const newValue = updater(currentValue);
		await configStore.set(newValue);
		return newValue;
	},
	// Add method to wait for initialization
	waitForInit: () => initializationPromise,
	// Add method to force reload from storage
	reload: async () => {
		const config = browser ? initializeBrowser() : await initializeServer();
		return config;
	}
};

export { configStore };

function getLocalStorageSize() {
	let totalSize = 0;

	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			const value = localStorage.getItem(key);
			totalSize += key.length + value.length;
		}
	} catch (error) {
		console.error('getLocalStorageSize()', error);
	}

	return totalSize;
}
