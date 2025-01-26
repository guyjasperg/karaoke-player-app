<script>
	import { onMount } from 'svelte';
	import VideoPlayer from '../../components/VideoPlayer.svelte'; // Import VideoPlayer
	import QRCode from '../../components/QRCode.svelte'; // Import the reusable QRCode component
	import qrcode from 'qrcode'; // Import the QR code library
	import { configStore } from '../../lib/stores/configStore.js'; // Import the store
	import { browser } from '$app/environment';

	// Reactive variables
	let queue = []; // Store the list of videos from the API
	let currentVideoIndex = 0; // Track the current video index
	let isLoading = true; // Track loading state
	let videoUrl = ''; // Video URL for the VideoPlayer component
	let showQrOverlay = false; // Controls whether the QR code overlay is visible
	let qrCodeUrl = ''; // Holds the generated QR code URL
	let queueUrl = ''; // Holds the generated QR code URL
	let queryParams = ''; // holds params to pass to queue route
	let sessionId = ''; // Unique session ID for the user
	let config; // Holds the configuration object

	// Subscribe to the config store
	configStore.subscribe((value) => {
		config = value;
	});

	// Default file path for testing (pointing to the local Node.js server)
	const defaultFilePath = 'http://192.168.108.4:3000/videos/Blue Sky - Hale.mp4';

	// Fetch session ID from cookie or generate a new one
	function getSessionId() {
		const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('sessionId='));
		if (cookie) {
			return cookie.split('=')[1];
		} else {
			const newSessionId = generateSessionId();
			document.cookie = `sessionId=${newSessionId}; path=/; max-age=86400`; // Expires in 1 day
			return newSessionId;
		}
	}

	// Generate a unique session ID
	function generateSessionId() {
		return 'session-' + Math.random().toString(36).substr(2, 9); // Random unique ID
	}

	// Fetch video queue from API based on session ID
	const fetchQueue = async () => {
		try {
			const response = await fetch(`${config.apapiBaseUrl}/api/queue?sessionId=${sessionId}`);
			const data = await response.json();
			queue = data.queue; // Assuming the API returns an array of video objects

			// If the queue is empty, use the default file path
			if (queue.length === 0) {
				videoUrl = defaultFilePath;
			} else {
				videoUrl = queue[currentVideoIndex].filepath; // Use the first video in the queue
			}
		} catch (error) {
			console.error('Failed to fetch queue:');
			// If the API fails, use the default file path
			queue = [];
			queue.push({
				Artist: 'Pink Floyd',
				Title: 'Another Brick In The Wall',
				filepath: defaultFilePath
			});
			videoUrl = defaultFilePath;
		} finally {
			isLoading = false; // Set loading to false after fetching
		}
	};

	// Play next video in the queue
	const playNextVideo = () => {
		if (currentVideoIndex < queue.length - 1) {
			currentVideoIndex++;
			videoUrl = queue[currentVideoIndex].filepath; // Update the video URL
		}
	};

	// Play previous video in the queue
	const playPreviousVideo = () => {
		if (currentVideoIndex > 0) {
			currentVideoIndex--;
			videoUrl = queue[currentVideoIndex].filepath; // Update the video URL
		}
	};

	// Function to generate the QR code for the queue route
	async function generateQrCode() {
		console.log('generateQrCode');
		const customSettingsString = encodeURIComponent(JSON.stringify(config));
		console.log(`sessionid: ${sessionId}`);
		console.log(`customSettings: ${customSettingsString}`);
		// console.log(customSettingsString);
		// console.log(config);
		// Include session ID and config settings in the URL
		queryParams = new URLSearchParams({
			sessionId,
			customSettingsString // Spread the config object into query parameters
		}).toString();

		queueUrl = `${window.location.origin}/queue?${queryParams}`;

		try {
			qrCodeUrl = await qrcode.toDataURL(queueUrl, {
				width: 200,
				height: 200
			});
			showQrOverlay = true; // Show the overlay
		} catch (error) {
			console.error('Failed to generate QR code:', error);
			alert('Failed to generate QR code. Please try again.');
		}
	}

	// Initialize session ID and fetch queue when the page loads
	onMount(() => {
		sessionId = getSessionId(); // Get or generate session ID
		fetchQueue(); // Fetch queue for the session
	});
</script>

<main class="h-screen flex flex-col">
	<!-- Header (10% height) -->
	<div class="h-[10%] bg-blue-200 flex items-center justify-center">
		<p class="text-2xl font-bold text-blue-800">Header (10%)</p>
	</div>

	<!-- Main Content (80% height) -->
	<div class="h-[80%] flex">
		<!-- Left Column (80% width) -->
		<div class="w-4/5 bg-green-200 flex items-center justify-center relative group">
			{#if isLoading}
				<p class="text-2xl font-semibold text-green-800">Loading queue...</p>
			{:else if queue.length === 0}
				<p class="text-2xl font-semibold text-green-800">
					No videos in the queue. Using default video.
				</p>
				<VideoPlayer {videoUrl} artist="Pink Floyd" title="Another Brick In The Wall" />
			{:else}
				<VideoPlayer
					videoUrl={queue[currentVideoIndex].filepath}
					artist={queue[currentVideoIndex].Artist}
					title={queue[currentVideoIndex].Title}
				/>
			{/if}
		</div>

		<!-- Right Column (20% width) -->
		<div class="w-1/5 bg-red-200 flex flex-col p-4 overflow-hidden">
			<!-- Top Section -->
			<div class="h-20 p-2 bg-white flex items-center justify-center">
				<button
					class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
					on:click={generateQrCode}
				>
					Show QR Code
				</button>
			</div>

			<!-- Middle Section -->
			<div class="h-full p-3 bg-purple-400 flex flex-col">
				<div>1</div>
				<div>2</div>
				<div>3</div>
				<div>4</div>
				<div>5</div>
			</div>

			<!-- Bottom Section -->
			<div class="h-20 p-2 bg-green-300 flex items-center justify-center">
				<!-- Button to Add New Item -->
				<button
					class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
				>
					Add New Item
				</button>
			</div>
		</div>
	</div>

	<!-- Footer (10% height) -->
	<div class="h-[10%] bg-blue-200 flex items-center justify-center">
		<p class="text-2xl font-bold text-blue-800">Footer (10%)</p>
	</div>

	<!-- QR code overlay -->
	{#if showQrOverlay}
		<div class="overlay">
			<div class="overlay-content">
				<h2>Scan to Queue Songs</h2>
				<QRCode {qrCodeUrl} />
				<!-- Clickable link below the QR code -->
				<p class="link-text">
					Or <a href={`/queue?${queryParams}`} class="link">click here</a> to queue songs.
				</p>
				<button on:click={() => (showQrOverlay = false)}>Close</button>
			</div>
		</div>
	{/if}
</main>

<style>
	/* Overlay styles */
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.overlay-content {
		background-color: white;
		padding: 2rem;
		border-radius: 8px;
		text-align: center;
	}

	.overlay-content h2 {
		margin-bottom: 1rem;
	}

	.overlay-content button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
	}

	.overlay-content button:hover {
		background-color: #0056b3;
	}
	/* Link styles */
	.link-text {
		margin-top: 1rem;
		font-size: 1rem;
		color: #333;
	}

	.link {
		color: #007bff;
		text-decoration: none;
		font-weight: bold;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
