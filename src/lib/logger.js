export function createLogger(routeName) {
	return function log(message, ...args) {
		const timestamp = formatDate(new Date());
		// const lineNumber = getLineNumber();
		console.log(`${timestamp} [${routeName}]: ${message}`, ...args);
	};
}

function formatDate(date) {
	const pad = (num, size = 2) => String(num).padStart(size, '0');
	const yyyy = date.getFullYear();
	const MM = pad(date.getMonth() + 1);
	const dd = pad(date.getDate());
	const HH = pad(date.getHours());
	const mm = pad(date.getMinutes());
	const ss = pad(date.getSeconds());
	const SSS = pad(date.getMilliseconds(), 3);
	const tickCount = String(date.getTime()).slice(-8);

	return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}.${SSS} ${tickCount}`;
}

function getLineNumber() {
	const error = new Error();
	const stack = error.stack.split('\n');

	for (const line of stack) {
		const match = line.match(/at\s*(.*?)\s*\(/);
		if (match) {
			const filename = match[1];
			if (filename.includes('.svelte')) {
				const parts = filename.split(':');
				if (parts.length > 1) {
					return parts[parts.length - 2];
				}
			}
		}
	}

	return 'unknown';
}
