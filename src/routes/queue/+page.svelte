<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Header from '../../components/Header.svelte';
	import Footer from '../../components/Footer.svelte';
	import Popup from '../../components/Popup.svelte';
	import SessionSongsPopup from '../../components/SessionSongsPopup.svelte';
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
			alert('Please enter a search query.');
			return;
		}

		isLoading = true;
		try {
			// Replace with your third-party API call
			const response = await fetch(
				`/api/proxy/api/songs/search?query=${encodeURIComponent(searchQuery)}&field=${encodeURIComponent('ALL')}`
			);

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
		console.log('getQueuedSongs');
		try {
			// Replace with your third-party API call
			const response = await fetch(
				`/api/proxy/api/songqueue/session/${encodeURIComponent(sessionId)}`
			);

			songs = await response.json();

			if (songs && songs.length > 0) {
				showSessionSongsPopup = true;
			} else {
				showPopupMessage('No songs found in the queue.', 'info');
			}
		} catch (error) {
			console.error('Failed to get queued songs:', error);
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
		try {
			// Construct the URL with query parameters
			const songData = {
				sessionId: sessionId,
				Artist: song.Artist,
				Title: song.Title,
				filePath: song.path
			};
			const url = new URL('/api/proxy/api/songqueue', window.location.origin);
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
			} else {
				alert('Failed to queue song. Please try again.');
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
		if (browser) {
			const url = new URL(window.location.href);
			console.log(`url: ${url}`);

			// Extract session ID from the URL (if provided)
			const urlSessionId = url.searchParams.get('sessionId');
			console.log('urlSessionId: ', urlSessionId);
			sessionId = urlSessionId || getSessionId(); // Use the URL session ID or generate a new one

			// Handle customSettings (if provided)
			const customSettings = url.searchParams.get('customSettingsString');
			console.log('customSettings: ', customSettings);
			console.log(customSettings);

			if (customSettings && customSettings !== '[object Object]') {
				try {
					configSettings = JSON.parse(decodeURIComponent(customSettings));
				} catch (error) {
					console.error('Failed to parse customSettings:', error);
				}
			}

			console.log('Session ID:', sessionId);
			console.log('Custom settings:', configSettings);
			console.log(configSettings.fileServer);

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
		// console.log('Link clicked!');
		// Call your custom function here
		getQueuedSongs();
	};
</script>

<main class="h-screen flex flex-col">
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
	<div class="flex-1 overflow-y-auto p-4 items-center justify-center">
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
			<input type="text" bind:value={searchQuery} placeholder="Search for songs..." />
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
			<div class="results-container" bind:this={resultsContainer}>
				<ul>
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
	<div class="h-[10%] bg-blue-200 flex items-center justify-center">
		<Footer />
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

	.results-container {
		text-align: left;
		max-width: 600px;
		margin: 0 auto;
		max-height: 400px; /* Limit height for scrollable container */
		overflow-y: auto; /* Enable vertical scrolling */
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.5rem;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
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
