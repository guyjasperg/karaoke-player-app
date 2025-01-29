<script>
	import { onMount } from 'svelte';
	import VideoPlayer from '../../components/VideoPlayer.svelte'; // Import VideoPlayer
	import Footer from '../../components/Footer.svelte';
	import QRCode from '../../components/QRCode.svelte'; // Import the reusable QRCode component
	import qrcode from 'qrcode'; // Import the QR code library
	import { configStore } from '../../lib/stores/configStore.js'; // Import the store
	import { browser } from '$app/environment';
	import Header from '../../components/Header.svelte';

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

	//VidepPlayer events
	function handleAlmostDone(event) {
		console.log('Video almost done:', event.detail.title);
		// Perform actions like loading the next video in the queue, etc.
		// ... your logic to handle the event
	}

	function handleEnded(event) {
		console.log('Video ended:', event.detail.title);
		// Load the next video, etc.
		// Remove the current song from the queue
		playNextVideo();

		// Load the next video if available
		//  if (queue.length > 0) {
		//      currentVideoUrl = queue[0].filePath;
		//      currentArtist = queue[0].Artist;
		//      currentTitle = queue[0].Title;
		//  } else {
		//      // Handle the case where the queue is empty
		//      currentVideoUrl = null; // Or some default state
		//      currentArtist = '';
		//      currentTitle = '';
		//  }
	}

	// Default file path for testing (pointing to the local Node.js server)
	const defaultFilePath = '';

	// Fetch session ID from cookie or generate a new one
	function getSessionId() {
		const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('sessionId='));
		if (cookie) {
			console.log(`sessionId from cookie: ${cookie.split('=')[1]}`);
			return cookie.split('=')[1];
		} else {
			const newSessionId = generateSessionId();
			console.log(`sessionId [NEW]]: ${newSessionId}`);
			document.cookie = `sessionId=${newSessionId}; path=/; max-age=86400`; // Expires in 1 day
			return newSessionId;
		}
	}

	// Generate a unique session ID
	function generateSessionId(length = 4) {
		const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // All uppercase letters
		let sessionId = '';

		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * letters.length);
			sessionId += letters[randomIndex]; // Append a random letter
		}

		return sessionId; // Prefix with "SESSION-"
	}

	// Function to get queued songs for sessionId using a third-party API
	//3rd party API
	// Endpoint to get all songs in the queue for a given sessionId
	// app.get('/api/songqueue/session/:sessionId', (req, res) => {
	// const { sessionId } = req.params;
	async function getQueuedSongs() {
		console.log('getQueuedSongs');
		console.log(config.customSettings);
		try {
			// Replace with your third-party API call
			const response = await fetch(
				`/api/proxy/api/songqueue/session/${encodeURIComponent(sessionId)}`
			);

			queue = await response.json();

			if (queue && queue.length > 0) {
				//need to modify filePath
				// Loop through the queue and modify filepaths (if needed)
				for (let i = 0; i < queue.length; i++) {
					queue[i].filePath = `${config.fileServer}${extractFilenameAndParent(queue[i].filePath)}`;
				}

				console.log('Queued songs:', queue);
				currentVideoIndex = 0;
				videoUrl = queue[currentVideoIndex].filePath; // Use the first video in the queue
			} else {
				console.log('No songs found in the queue.');
				videoUrl = defaultFilePath;
			}
		} catch (error) {
			queue = [];
			currentVideoIndex = -1;
			console.error('Failed to get queued songs:', error);
			showPopupMessage('Failed to get queued songs.', 'error');
		} finally {
			console.log('getQueuedSongs finally');
			isLoading = false; // Set loading to false after fetching
		}
	}

	function extractFilenameAndParent(filepath) {
		// 1. Normalize the path (handle different path separators)
		const normalizedPath = filepath.replace(/\\/g, '/'); // Replace backslashes with forward slashes

		// 2. Extract the filename
		const filename = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);

		// 3. Extract the parent folder
		const parentFolder = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
		const parentFolderName = parentFolder.substring(parentFolder.lastIndexOf('/') + 1);

		return `${parentFolderName}/${filename}`;
		// return {
		// 	filename: filename,
		// 	parentFolder: parentFolderName // Return the name of the immediate parent folder
		// };
	}

	// Play next video in the queue
	const playNextVideo = () => {
		console.log('playNextVideo', queue.length);
		if (queue.length > 0) {
			videoUrl = queue[1].filePath; // Update the video URL
		} else {
			videoUrl = '';
		}
		removeCurrentSong();
	};

	// Play previous video in the queue
	const playPreviousVideo = () => {
		if (currentVideoIndex > 0) {
			currentVideoIndex--;
			videoUrl = queue[currentVideoIndex].filePath; // Update the video URL
		}
	};

	// Optional: Remove the currently played song from the queue
	function removeCurrentSong() {
		if (queue.length > 0) {
			// Check if the queue is not empty
			const removedSong = queue[0]; // Get the song to be removed (but don't remove yet)

			//also remove from server

			console.log('Removed song:', removedSong.Title, removedSong.Artist);

			queue = queue.slice(1); // Create a *new* array excluding the first element
		}
	}

	// Function to generate the QR code for the queue route
	async function generateQrCode() {
		console.log('generateQrCode');
		console.log(config);
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

	// Track the selected song
	let selectedSongId = null;

	// Reference to the container for scrolling
	let listContainer;

	// Function to handle song selection
	function selectSong(id, song) {
		selectedSongId = id;
		scrollSelectedIntoView();
		console.log('Selected Song:', song.Artist, song.Title, song.filePath); // Log the full song object
	}

	// Function to scroll the selected item into view
	function scrollSelectedIntoView() {
		if (listContainer && selectedSongId !== null) {
			const selectedElement = listContainer.querySelector(`[data-song-id="${selectedSongId}"]`);
			if (selectedElement) {
				selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}

	// Handle arrow key navigation
	function handleKeyDown(event) {
		if (queue && queue.length > 0) {
			const currentIndex = queue.findIndex((song) => song.sequenceID === selectedSongId);
			let newIndex = currentIndex;

			if (event.key === 'ArrowDown') {
				newIndex = (currentIndex + 1) % queue.length; // Move down
			} else if (event.key === 'ArrowUp') {
				newIndex = (currentIndex - 1 + queue.length) % queue.length; // Move up
			}

			if (newIndex !== currentIndex) {
				selectSong(queue[newIndex].sequenceID, queue[newIndex]);
			}
		}
	}

	// Initialize session ID and fetch queue when the page loads
	onMount(() => {
		sessionId = getSessionId(); // Get or generate session ID
		// fetchQueue(); // Fetch queue for the session
		getQueuedSongs();

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<main class="h-screen flex flex-col">
	<!-- Header (10% height) -->
	<div class="h-[10%] bg-blue-200 flex items-center justify-center">
		<!-- <p class="text-2xl font-bold text-blue-800">Header (10%)</p> -->
		<Header />
	</div>

	<!-- Main Content (80% height) -->
	<div class="h-[80%] flex">
		<!-- Left Column (80% width) -->
		<div class="w-4/5 bg-slate-700 flex items-center justify-center relative group">
			{#if isLoading}
				<p class="text-2xl font-semibold text-green-800">Loading queue...</p>
			{:else if queue.length === 0}
				<p class="text-4xl font-semibold text-green-800">No videos in the queue.</p>
				<!-- <VideoPlayer {videoUrl} artist="Pink Floyd" title="Another Brick In The Wall" /> -->
			{:else}
				{console.log('Initializing VideoPlayer...')}
				<VideoPlayer
					videoUrl={queue[currentVideoIndex].filePath}
					artist={queue[currentVideoIndex].Artist}
					title={queue[currentVideoIndex].Title}
					on:almostdone={handleAlmostDone}
					on:ended={handleEnded}
				/>
			{/if}
		</div>

		<!-- Right Column (20% width) -->
		<div class="w-1/5 bg-slate-600 flex flex-col overflow-hidden">
			<!-- Top Section -->
			<div class="h-full p-0 flex flex-col overflow-clip">
				<p class="text-center font-semibold mt-2 mb-1 text-gray-400">Songs in queue</p>
				<!-- show queued songs -->
				{#if queue && queue.length > 0}
					<div
						class="h-full p-2 bg-slate-600 flex flex-col overflow-y-auto"
						bind:this={listContainer}
					>
						<ul>
							{#each queue as song, index}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									data-song-id={song.sequenceID}
									data-song-data={JSON.stringify(song)}
									class="text-black text-sm overflow-hidden whitespace-nowrap text-ellipsis select-text cursor-pointer p-1 rounded {selectedSongId ===
									song.sequenceID
										? 'bg-slate-700 text-white'
										: 'hover:bg-slate-300'}"
									on:click={() => selectSong(song.sequenceID, song)}
								>
									{song.Title} - {song.Artist}
								</div>
							{/each}
						</ul>
					</div>

					<!-- Playback controls -->
					<div class="flex flex-col justify-center p-1 gap-1">
						<button
							on:click={playNextVideo}
							class="bg-blue-500 hover:bg-blue-600 text-white rounded w-full"
						>
							Play Next
						</button>
					</div>
				{/if}
			</div>

			<!-- Bottom Section -->
			<div class="h-20 p-2 bg-slate-600 flex items-center justify-center">
				<button
					class="bg-none text-white text-4xl rounded-lg hover:bg-blue-400 hover:text-white transition duration-300 flex items-center justify-center"
					on:click={generateQrCode}
				>
					<!-- <i class="fas fa-qrcode"></i> -->
					<!-- QR code icon -->
					<!-- Custom QR code SVG icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-10"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Footer (10% height) -->
	<div class="h-[10%] bg-blue-200 flex items-center justify-center">
		<Footer />
	</div>

	<!-- QR code overlay -->
	{#if showQrOverlay}
		<div class="overlay">
			<div class="overlay-content">
				<h2>Scan to Queue Songs</h2>
				<QRCode {qrCodeUrl} />
				<p class=" text-sm">{sessionId}</p>
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
