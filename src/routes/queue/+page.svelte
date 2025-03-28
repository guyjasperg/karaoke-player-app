<script>
	import { createLogger } from '$lib/logger';
	const trace = createLogger('queue');

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Header from '../../components/Header.svelte';
	import Footer from '../../components/Footer.svelte';
	import Popup from '../../components/Popup.svelte';
	import SessionSongsPopup from '../../components/SessionSongsPopup.svelte';
	import { configStore } from '../../lib/stores/configStore.js'; // Import the store
	// import { messages, sendMessage } from '../../lib/socket';

	let searchQuery = ''; // Holds the user's search query
	let searchResults = []; // Holds the search results from the API
	let isLoading = false; // Tracks whether the search is in progress
	let sessionId = ''; // Unique session ID for the user
	let configSettings = {}; // Holds custom settings passed from the URL
	let currentPage = 1;
	let rowsPerPage = 20; // Default rows per page
	let selectedIndex = -1; // Tracks the currently selected row
	let resultsContainer; // Reference to the results container
	let songs = []; // List of all songs in the queue
	let showSessionSongsPopup = false; // Controls popup visibility

	//popup
	let popupMessage = '';
	let popupType = 'info';
	let showPopup = false;

	let config;
	// Subscribe to the config store
	configStore.subscribe((value) => {
		// config = value;
		// trace('Current configuration:', value);
		trace('subscribed to configStore');
		config = value;
		trace(config);
	});

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

	// Function to search for songs using a third-party API
	async function searchSongs() {
		if (searchQuery.trim() === '') {
			showPopupMessage('Please enter a search query.', 'warning');
			// alert('Please enter a search query.');
			return;
		}

		isLoading = true;
		try {
			// Construct the URL with query parameters
			const url = new URL(
				`/api/proxy/${config.apiBaseUrl}/api/songs/search`,
				window.location.origin
			);
			url.searchParams.append('query', searchQuery);
			url.searchParams.append('field', 'ALL');
			url.searchParams.append('additionalParam1', 'value1'); // Add additional parameters as needed
			url.searchParams.append('additionalParam2', 'value2');

			// Replace with your third-party API call
			const response = await fetch(url.toString());

			const data = await response.json();
			searchResults = data; // Assuming the API returns an array of results
			selectedIndex = -1; // Reset selected index when new results are loaded
		} catch (error) {
			console.error('Failed to search for songs:', error);
			showPopupMessage('Failed to search for songs. Please try again.', 'error');
		} finally {
			isLoading = false;
		}
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
				`/api/proxy/${config.apiBaseUrl}/api/songqueue/session/${encodeURIComponent(sessionId)}`
			);

			songs = await response.json();

			if (songs && songs.length > 0) {
				showSessionSongsPopup = true;
			} else {
				showPopupMessage('No songs found in the queue.', 'info');
			}
		} catch (error) {
			trace('Failed to get queued songs:', error);
			showPopupMessage('Failed to get queued songs.', 'error');
		} finally {
			// showSessionSongsPopup = true;
		}
	}
	// Function to queue a song

	//[3rd-party API]
	// Endpoint to add a song to the queue
	// app.post('/api/songqueue', (req, res) => {
	//     const { sessionId, Artist, Title, filePath, status } = req.body;
	async function queueSong(song) {
		trace('queueSong:', sessionId, song);
		try {
			// Construct the URL with query parameters
			const songData = {
				sessionId: sessionId,
				Artist: song.Artist,
				Title: song.Title,
				filePath: song.path
			};
			trace('queueSong:', sessionId, songData.Title);
			const url = new URL(`/api/proxy/${config.apiBaseUrl}/api/songqueue`, window.location.origin);
			// url.searchParams.append('sessionId', sessionId);
			// url.searchParams.append('Artist', song.Artist);
			// url.searchParams.append('Title', song.Title);
			// url.searchParams.append('filePath', song.path);

			// Make the POST request with the URL
			const response = await fetch(url.toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(songData)
			});

			if (response.ok) {
				// alert(`Queued: ${song.Title}`);
				showPopupMessage(`Queued: ${song.Title}`, 'success');
				trace('queueSong', 'success');
			} else {
				alert('Failed to queue song. Please try again.');
				trace('queueSong', 'fail');
			}
		} catch (error) {
			console.error('Failed to queue song:', error);
			alert('Failed to queue song. Please try again.');
		}
	}

	// Handle keyboard events for row selection
	function handleKeyDown(event) {
		if (searchResults.length === 0) return; // No results to navigate

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault(); // Prevent scrolling
				selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : searchResults.length - 1; // Move up or wrap to bottom
				break;
			case 'ArrowDown':
				event.preventDefault(); // Prevent scrolling
				selectedIndex = selectedIndex < searchResults.length - 1 ? selectedIndex + 1 : 0; // Move down or wrap to top
				break;
			case 'Enter':
				if (selectedIndex !== -1) {
					queueSong(searchResults[selectedIndex]); // Queue the selected song
				}
				break;
		}

		// Scroll the selected row into view
		if (selectedIndex !== -1 && resultsContainer) {
			const selectedRow = resultsContainer.querySelector(`li:nth-child(${selectedIndex + 1})`);
			if (selectedRow) {
				selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}

	// Handle click on sessionId
	const handleSessionIdClick = () => {
		getQueuedSongs();
		//showSessionSongsPopup = true;
	};

	// Initialize session ID and event listener when the page loads
	onMount(() => {
		trace('onMount');
		if (browser) {
			const url = new URL(window.location.href);
			trace(`url: ${url}`);
			trace('config:', config);
			// Extract session ID from the URL (if provided)
			const urlSessionId = url.searchParams.get('sessionId');
			trace('urlSessionId: ', urlSessionId);
			sessionId = urlSessionId || getSessionId(); // Use the URL session ID or generate a new one

			// Handle customSettings (if provided)
			const customSettings = url.searchParams.get('customSettingsString');
			trace('customSettings: ', customSettings);
			trace(customSettings);

			if (customSettings && customSettings !== '[object Object]') {
				try {
					configSettings = JSON.parse(decodeURIComponent(customSettings));
				} catch (error) {
					console.error('Failed to parse customSettings:', error);
				}
			}

			trace('Session ID:', sessionId);
			trace('Custom settings:', configSettings);
			trace(configSettings.fileServer);

			// Add keyboard event listener
			window.addEventListener('keydown', handleKeyDown);
		}

		// Cleanup event listener when the component is destroyed
		return () => {
			if (browser) {
				window.removeEventListener('keydown', handleKeyDown);
			}
		};
	});

	// Example function to show a success message
	const showPopupMessage = (message, type) => {
		popupMessage = message;
		popupType = type;
		showPopup = true;
	};

	const handleSessionIDClick = (event) => {
		event.preventDefault(); // Prevent the default navigation behavior
		// trace('Link clicked!');
		// Call your custom function here
		getQueuedSongs();
	};
</script>

<main>
	<div class="flex flex-col h-screen">
		<!-- Header (10% height) -->
		<div class=" bg-slate-500 flex items-center justify-center">
			<!-- <p class="text-2xl font-bold text-blue-800">Header (10%)</p> -->
			<Header title="Queue Songs" />
		</div>

		<!-- Popup Component -->
		<Popup message={popupMessage} type={popupType} bind:visible={showPopup} />

		<!-- Session Songs Popup -->
		<SessionSongsPopup {sessionId} {songs} bind:visible={showSessionSongsPopup} />

		<!-- Main Content (80% height, scrollable) -->
		<div class="flex-1 p-4 items-center justify-center">
			<!-- Display session ID with Tailwind styles -->
			{#if sessionId}
				<p class="text-md text-gray-400 mb-4 text-center">
					SessionID: <a href="/" class="text-blue-600 font-bold" on:click={handleSessionIDClick}>
						{sessionId}
					</a>
				</p>
			{/if}

			<p class="text-lg m-4 text-center">Search for songs to add to the karaoke queue.</p>

			<!-- Search input and button -->
			<div class="flex justify-center gap-2 mb-5">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search for songs..."
					on:keydown={(e) => e.key === 'Enter' && searchSongs()}
					on:focus={(e) => {
						selectedIndex = -1;
						e.target.select();
					}}
				/>
				<button on:click={searchSongs} disabled={isLoading}>
					{#if isLoading}
						Searching...
					{:else}
						Search
					{/if}
				</button>
			</div>

			<!-- Search results -->
			{#if searchResults.length > 0}
				<h2 class="text-center mb-2 text-slate-600">Search Result [{searchResults.length}]</h2>
				<div
					class="flex-1 text-left max-w-[600px] max-h-[calc(100vh-20rem)] mx-auto overflow-y-auto border border-gray-300 rounded-md p-2"
					bind:this={resultsContainer}
				>
					<ul class="p-0 m-0 overflow-y-scroll">
						{#each searchResults as song, index}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<li class:selected={index === selectedIndex} on:click={() => (selectedIndex = index)}>
								<span>{song.Artist} - {song.Title}</span>
								<button on:click={() => queueSong(song)}>Queue</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		<!-- Footer (10% height) -->
		<div class="h-[10%] bg-blue-200 items-center justify-center">
			<Footer />
		</div>
	</div>
</main>

<style>
	input {
		padding: 0.5rem;
		font-size: 1rem;
		width: 300px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
	}

	button:hover {
		background-color: #0056b3;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #ccc;
		cursor: pointer;
	}

	li.selected {
		background-color: #f0f0f0; /* Highlight selected row */
	}

	li:last-child {
		border-bottom: none;
	}
</style>
