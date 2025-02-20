import pako from 'pako';
import os from 'os';

export function compressString(input) {
	console.log('compressString', input);
	// Step 1: Convert the input string to a Uint8Array
	const uint8Array = new TextEncoder().encode(input);

	// Step 2: Compress the Uint8Array using pako.gzip
	const compressed = pako.gzip(uint8Array);

	// Step 3: Encode the compressed binary data as a Base64 string
	return btoa(String.fromCharCode(...compressed));
}

export function decompressString(compressed) {
	console.log('decompressString', compressed);
	try {
		// Step 1: Decode the Base64 string into a binary string
		const binaryString = atob(compressed);

		// Step 2: Convert the binary string into a Uint8Array
		const uint8Array = new Uint8Array(binaryString.split('').map((char) => char.charCodeAt(0)));

		// Step 3: Decompress the Uint8Array using pako.ungzip
		const decompressed = pako.ungzip(uint8Array, { to: 'string' });

		return decompressed;
	} catch (error) {
		console.error('Decompression failed:', error.message);
		throw error; // Re-throw the error for debugging
	}
}

// Example usage
// (async () => {
// 	const original = 'This is a very long string that needs to be compressed.';
// 	const compressed = await compressString(original);
// 	console.log('Compressed:', compressed); // Shorter Base64-encoded string

// 	const decompressed = await decompressString(compressed);
// 	console.log('Decompressed:', decompressed); // Original string
// })();

export function getLocalIPAddress() {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			if (iface.family === 'IPv4' && !iface.internal) {
				return iface.address;
			}
		}
	}
	return '127.0.0.1'; // Fallback to localhost if no external IP is found
}
