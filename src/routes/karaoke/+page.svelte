<script>
	import { createLogger } from '$lib/logger';
	const trace = createLogger('karaoke');

	import { onMount, onDestroy } from 'svelte';
	import { getSocket } from '../../lib/socket'; // Adjust the path to your socket instance
	import { slide } from 'svelte/transition'; // Import the slide transition
	import VideoPlayer from '../../components/VideoPlayer.svelte'; // Import VideoPlayer
	import Header from '../../components/Header.svelte';
	import Footer from '../../components/Footer.svelte';
	import Marquee from '../../components/Marquee.svelte';
	import QRCode from '../../components/QRCode.svelte'; // Import the reusable QRCode component
	import qrcode from 'qrcode'; // Import the QR code library
	// import { get } from 'svelte/store';
	import { configStore } from '../../lib/stores/configStore.js'; // Import the store
	import { browser } from '$app/environment';
	import { getIPAddress } from '$lib/app';

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
	let showNextSong = false;
	let nextSongTitle = ''; // Store the title of the next song
	let showSongList = true; // Control visibility of song list overlay
	let footer_message = '--***--';
	let socket;
	let isSocketConnected = false;
	let videoPlayer;

	function toggleSongList() {
		showSongList = !showSongList;
	}

	function closeSongList() {
		showSongList = false;
	}

	const slideOptions = {
		duration: 5000, // Duration in milliseconds (e.g., 500ms = 0.5 seconds)
		easing: 'ease-in-out' // Easing function (e.g., 'ease-in-out', 'ease-in', 'ease-out', 'linear')
	};

	// Subscribe to the config store
	configStore.subscribe((value) => {
		// config = value;
		// trace('Current configuration:', value);
		trace('subscribed tp configStore');
		config = value;
		trace(config);
	});

	// // Retrieve the current value of the store
	// config = get(configStore);

	//VidepPlayer events
	function handleAlmostDone(event) {
		trace('Video almost done:', event.detail.title);
		// Perform actions like loading the next video in the queue, etc.
		// ... your logic to handle the event
		if (queue.length > 1) {
			nextSongTitle = queue[1].Title;
			showNextSong = true;
		} else {
			nextSongTitle = '';
		}
	}

	function handleEnded(event) {
		trace('Video ended:', event.detail.title);
		// Load the next video, etc.
		// Remove the current song from the queue
		if (queue.length === 1) {
			//last song
			removeCurrentSong();
		} else {
			playNextVideo();
		}
		showNextSong = false;
	}

	function handleVideoError(event) {
		console.error('Video player error in Karaoke route:', event.detail.message);
		// Handle the error in your karaoke route (e.g., display a message, load a different video, etc.)
		alert(event.detail.message);
		// Example: Load a default video
		// currentVideoUrl = '/path/to/default/video.mp4';
	}

	// Default file path for testing (pointing to the local Node.js server)
	const defaultFilePath = '';

	// Fetch session ID from cookie or generate a new one
	function getSessionId() {
		const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('sessionId='));
		if (cookie) {
			trace(`sessionId from cookie: ${cookie.split('=')[1]}`);
			configStore.update((config) => ({ ...config, sessionId: cookie.split('=')[1] })); // Persist sessionId to configStore
			return cookie.split('=')[1];
		} else {
			const newSessionId = generateSessionId();
			trace(`sessionId [NEW]]: ${newSessionId}`);
			document.cookie = `sessionId=${newSessionId}; path=/; max-age=86400`; // Expires in 1 day
			configStore.update((config) => ({ ...config, sessionId: newSessionId })); // Persist sessionId to configStore
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
		trace('getQueuedSongs');

		try {
			// Replace with your third-party API call
			const response = await fetch(
				`/api/proxy/api/songqueue/session/${encodeURIComponent(sessionId)}`
			);

			queue = await response.json();
			// trace(queue);

			if (queue && queue.length > 0) {
				//need to modify filePath
				// Loop through the queue and modify filepaths (if needed)
				for (let i = 0; i < queue.length; i++) {
					// queue[i].filePath = `${config.fileServer}${extractFilenameAndParent(queue[i].filePath)}`;
					queue[i].filePath =
						`http://192.168.206.4:3000/Videos/${extractFilenameAndParent(queue[i].filePath)}`;
				}

				// trace('Queued songs:', queue);
				currentVideoIndex = 0;
				videoUrl = queue[currentVideoIndex].filePath; // Use the first video in the queue
				nextSongTitle = queue[currentVideoIndex].Title;
				footer_message = videoUrl;
			} else {
				trace('No songs found in the queue.');
				videoUrl = defaultFilePath;
			}
		} catch (error) {
			queue = [];
			currentVideoIndex = -1;
			trace('Failed to get queued songs:', error);
			// showPopupMessage('Failed to get queued songs.', 'error');
		} finally {
			trace('getQueuedSongs finally');
			if (queue && queue.length === 1) {
				if (queue[0].message) {
					//probably an error message
					queue = [];
				}
			}
			isLoading = false; // Set loading to false after fetching
		}
	}

	function addToQueue(song) {
		// update filepath
		song.filePath = `${config.fileServer}${extractFilenameAndParent(song.filePath)}`;
		trace('addToQueue', song);
		queue = [...queue, song];
		trace('Added song to queue:', song);
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
		trace('playNextVideo', queue.length);
		if (queue.length > 1) {
			videoPlayer.stop();
			videoUrl = queue[1].filePath; // Update the video URL
		} else {
			//this is the last song in queue
			videoUrl = '';
		}
		removeCurrentSong();
		nextSongTitle = videoUrl;
		footer_message = videoUrl;
		showNextSong = true;
	};

	// Play previous video in the queue
	const playPreviousVideo = () => {
		if (currentVideoIndex > 0) {
			currentVideoIndex--;
			videoUrl = queue[currentVideoIndex].filePath; // Update the video URL
		}
	};

	// Optional: Remove the currently played song from the queue
	async function removeCurrentSong() {
		// Check if the queue is not empty
		if (queue.length > 0) {
			const removedSong = queue[0]; // Get the song to be removed (but don't remove yet)

			//remove from server
			const url = new URL(
				`/api/proxy/api/songqueue/${removedSong.sequenceID}`,
				window.location.origin
			);
			url.searchParams.append('sessionID', sessionId); // Add sessionID as a query parameter

			const response = await fetch(url.toString(), {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error deleting song');
			}

			const deletedSong = await response.json();
			trace('Song deleted from queue:', deletedSong);

			queue = queue.slice(1); // Create a *new* array excluding the first element
		}
	}

	// Function to generate the QR code for the queue route
	async function generateQrCode() {
		trace('generateQrCode');
		// trace(config);
		const customSettingsString = encodeURIComponent(JSON.stringify(config));
		trace(`sessionid: ${sessionId}`);
		// trace(`customSettings: ${customSettingsString}`);
		// trace(customSettingsString);
		// trace(config);
		// Include session ID and config settings in the URL
		queryParams = new URLSearchParams({
			sessionId,
			customSettingsString // Spread the config object into query parameters
		}).toString();

		queueUrl = `${window.location.origin}/queue?${queryParams}`;

		try {
			qrCodeUrl = await qrcode.toDataURL(queueUrl, {
				width: 350,
				height: 350
			});
			// showSongList = false;
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
		trace('Selected Song:', song.Artist, song.Title, song.filePath); // Log the full song object
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
		trace('onMount()');

		const ipAddress = getIPAddress();
		trace('Local IP Address:', ipAddress);

		sessionId = getSessionId(); // Get or generate session ID

		// socket = getSocket('http://192.168.1.6:3000');

		isSocketConnected = socket.connected;

		socket.on('connect', () => {
			trace('socket connected');
			isSocketConnected = true;
		});

		socket.on('disconnect', () => {
			isSocketConnected = false;
		});

		socket.on('songQueueUpdated', (data) => {
			// const msg = JSON.stringify(message);
			if (data.action == 'add') {
				trace('song added to queue: ', data);
				if (data.sessionID == config.sessionId) {
					addToQueue(data.song);
				} else {
					trace('Not for this session.');
				}
			}

			//only add song if it is for the current session
			// messages.update((currentMessages) => [...currentMessages, data.song]);
		});

		// fetchQueue(); // Fetch queue for the session
		getQueuedSongs();

		// Update the store with new configuration
		configStore.update((config) => {
			return { ...config, fileServer: 'http://localhost:3000/videos/' };
		});

		window.addEventListener('resize', () => {
			if (window.innerWidth > 768) {
				showSongList = true;
			}
		});

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	onDestroy(() => {
		// Clean up event listeners when the component is destroyed
		if (socket) {
			socket.off('exampleEvent');
		}
	});
</script>

<main class="flex flex-col h-screen">
	<!-- Header (10% height) -->
	<div class=" bg-gray-800 flex items-center justify-center">
		<!-- <p class="text-2xl font-bold text-blue-800">Header (10%)</p> -->
		<Header title="Karaoke Player" />
	</div>

	<!-- Main Content (80% height) -->
	<div class="flex flex-grow overflow-hidden relative">
		<!-- Left Column (80% width) -->
		<div class="w-full md:w-4/5 bg-slate-950 flex items-center justify-center relative group">
			{#if isLoading}
				<p class="text-2xl font-semibold text-green-800">Loading queue...</p>
			{:else if queue && queue.length === 0}
				<p class="text-4xl font-semibold text-green-800">No videos in the queue.</p>
				<!-- <VideoPlayer {videoUrl} artist="Pink Floyd" title="Another Brick In The Wall" /> -->
			{:else}
				{trace('Initializing VideoPlayer...')}
				<VideoPlayer
					bind:this={videoPlayer}
					videoUrl={queue[currentVideoIndex].filePath}
					artist={queue[currentVideoIndex].Artist}
					title={queue[currentVideoIndex].Title}
					nextSong=""
					on:almostdone={handleAlmostDone}
					on:ended={handleEnded}
				/>
				{#if showNextSong}
					<div class="absolute bottom-10 left-0 right-0 bg-transparent p-4 text-white text-4xl">
						<Marquee text={nextSongTitle} speed={0.15} fadeDuration={3000} />
					</div>
				{/if}
			{/if}
		</div>

		<!-- svelte-ignore a11y_consider_explicit_label -->
		<!-- toggle songList on small screen -->
		<button
			class="md:hidden absolute top-1/2 right-4 -translate-y-1/2 text-white p-2 rounded-full z-50 opacity-30"
			on:click={toggleSongList}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
				/>
			</svg>
		</button>

		<!-- Right Column -->
		{#if showSongList}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="fixed top-0 left-0 w-full h-full bg-black/50 z-40 md:hidden"
				on:click={toggleSongList}
			></div>
			<div
				class="flex flex-col fixed top-0 right-0 h-full w-3/5 bg-slate-600 z-50 md:static md:w-1/5 transition:slide={slideOptions}"
			>
				<div class="flex flex-col p-0 h-full">
					<!-- Songs in queue header -->
					<div class="flex flex-row items-center justify-center">
						<p class="text-center font-semibold mt-2 mb-1 text-gray-400">Songs in queue</p>
						<!-- refresh button -->
						<button
							type="button"
							on:click={getQueuedSongs}
							class="text-slate-300 hover:font-semibold hover:text-white font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center transform transition-transform duration-200 active:scale-90"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
								/>
							</svg>
							<span class="sr-only">Icon description</span>
						</button>
					</div>
					<hr class="my-1 border-slate-400" />

					<!-- List of queued songs -->
					<div class="flex-grow overflow-y-auto p-2 bg-slate-600" bind:this={listContainer}>
						{#if queue && queue.length > 0}
							<ul>
								{#each queue as song, index}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
									<li
										data-song-id={song.sequenceID}
										data-song-data={JSON.stringify(song)}
										class="text-slate-900 text-sm font-light overflow-hidden whitespace-nowrap text-ellipsis select-text cursor-pointer p-1 rounded {selectedSongId ===
										song.sequenceID
											? 'bg-slate-600 text-white'
											: 'hover:bg-slate-500'}"
										on:click={() => selectSong(song.sequenceID, song)}
									>
										{song.Title} - {song.Artist}
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Play next / QR -->
					<div class="flex flex-col justify-center p-1 gap-1">
						<!-- Play Next Song -->
						<button
							on:click={playNextVideo}
							class="bg-blue-500 hover:bg-blue-600 text-white rounded w-full"
						>
							Play Next
						</button>
						<!-- QR Code Button -->
						<div class="h-20 p-2 bg-slate-600 flex items-center justify-center">
							<button
								class="bg-none text-white text-4xl rounded-lg hover:bg-slate-500 hover:text-white transition duration-300 flex items-center justify-center"
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
			</div>
		{/if}
	</div>

	<!-- Footer (10% height) -->
	<div class="flex bg-gray-800 items-center justify-center py-2">
		<Footer message={footer_message} {isSocketConnected} />
	</div>

	<!-- QR code overlay -->
	{#if showQrOverlay}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="overlay" on:click={() => (showQrOverlay = false)}>
			<div class="overlay-content" on:click|stopPropagation>
				<h2>Scan to Queue Songs</h2>
				<QRCode {qrCodeUrl} />
				<p class="text-md font-bold">{sessionId}</p>
				<!-- Clickable link below the QR code -->
				<p class="link-text">
					Or <a href={`/queue?${queryParams}`} class="link">click here</a>.
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
