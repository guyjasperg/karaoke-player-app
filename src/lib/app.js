import { initializeTrie } from './trie';
import os from 'os';

// Call initializeTrie *once* when your app starts.  hooks.js is a great place for this
export const handle = async ({ event, resolve }) => {
	console.log('Initializing Trie...');
	await initializeTrie();
	const response = await resolve(event);
	return response;
};

export function getIPAddress() {
	// const interfaces = os.networkInterfaces();
	// for (const name of Object.keys(interfaces)) {
	// 	for (const iface of interfaces[name]) {
	// 		if (iface.family === 'IPv4' && !iface.internal) {
	// 			return iface.address;
	// 		}
	// 	}
	// }
	return '127.0.0.1'; // Fallback to localhost if no external IP is found
}
