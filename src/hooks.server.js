import { createLogger } from '$lib/logger';

const trace = createLogger('hooks.server');

export const handle = async ({ event, resolve }) => {
	// Log the incoming request
	trace('Incoming request:', event.url.toString());

	// Get the local IP address
	const clientAddress = event.getClientAddress();
	trace('Client IP Address:', clientAddress);
	trace(event.url.pathname);

	// Check if the request is for the proxy endpoint
	if (event.url.pathname.startsWith('/api/proxy/')) {
		// Extract the target URL from the path by removing '/api/proxy/'
		const targetUrl = new URL(event.url.pathname.replace('/api/proxy/', ''), event.url.origin);
		trace('Proxying to:', targetUrl.href);

		// Copy query parameters from the original request
		event.url.searchParams.forEach((value, key) => {
			targetUrl.searchParams.append(key, value);
		});

		// Forward the request to the target API using fetch
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

			trace('Sending proxy request with options:', fetchOptions);
			const response = await fetch(targetUrl.toString(), fetchOptions);
			trace(`Proxy response: ${response.status} ${response.statusText}`);

			// Return the response from the target API
			return new Response(response.body, {
				status: response.status,
				headers: response.headers
			});
		} catch (err) {
			trace('Proxy error:', err);
			return new Response('Proxy error: ' + err.message, { status: 500 });
		}
	}

	// Continue with the normal SvelteKit flow
	return resolve(event);
};
