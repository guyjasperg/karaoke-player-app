import { configStore } from '$lib/stores/configStore.js';
import { createLogger } from '$lib/logger';

const trace = createLogger('hooks.server');

// Access the current configuration from configStore
let config;
configStore.subscribe((value) => {
	trace('configStore.subscribe()');
	config = value;
})();

export const handle = async ({ event, resolve }) => {
	// Log the incoming request
	trace('Incoming request:', event.url.toString());

	// Get the local IP address
	const clientAddress = event.getClientAddress();
	trace('Client IP Address:', clientAddress);

	// Check if the request is for the proxy endpoint
	if (event.url.pathname.startsWith('/api/proxy')) {
		// Construct the target URL
		const targetUrl = new URL(
			event.url.pathname.replace('/api/proxy', ''),
			config.apiBaseUrl // The 3rd party API base URL
		);
		trace('targetUrl', targetUrl.href);

		// Copy query parameters from the original request
		event.url.searchParams.forEach((value, key) => {
			targetUrl.searchParams.append(key, value);
		});

		// Forward the request to the 3rd party API using fetch
		try {
			const fetchOptions = {
				method: event.request.method,
				headers: event.request.headers,
				body:
					event.request.method !== 'GET' && event.request.method !== 'HEAD'
						? event.request.body
						: undefined
			};

			// Add the `duplex` option for requests with a body
			if (fetchOptions.body) {
				fetchOptions.duplex = 'half';
			}

			const response = await fetch(targetUrl.toString(), fetchOptions);
			console.log(response.status, response.statusText);

			// Return the response from the 3rd party API
			return new Response(response.body, {
				status: response.status,
				headers: response.headers
			});
		} catch (err) {
			console.error('Proxy error:', err);
			return new Response('Proxy error', { status: 500 });
		}
	}

	// Continue with the normal SvelteKit flow
	return resolve(event);
};
