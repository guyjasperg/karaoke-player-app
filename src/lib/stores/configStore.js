import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Load saved configuration from localStorage (only in the browser)
const savedConfig = browser ? JSON.parse(localStorage.getItem('backendConfig') || '{}') : {};

// Create a writable store with the saved configuration
export const configStore = writable(savedConfig);