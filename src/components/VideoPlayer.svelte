<script>
	import { createLogger } from '$lib/logger';
	const trace = createLogger('VideoPlayer');

	import { onMount, onDestroy, createEventDispatcher } from 'svelte';

	// Props
	export let videoUrl = ''; // Video URL (filepath) passed from parent
	export let artist = ''; // Artist name passed from parent
	export let title = ''; // Song title passed from parent
	export let nextSong = ''; //Next song in queue

	// Reactive variables
	let isPlaying = false;
	let showControls = false; // Controls are hidden by default
	let showSongDetails = true; // Controls visibility of song details
	let timeoutId; // Store the timeout ID for cleanup
	let currentTime = 0; // Current playback time
	let duration = 0; // Total duration of the video
	let progressBarWidth = 0; // Width of the progress bar (0-100%)
	let progressBar; // Add a variable to store the progress bar element
	let volume = 1; // Volume level (0 to 1)
	let isMuted = false; // Mute state
	let lastVolume = 1; // Store the last volume setting before muting
	let showVolumeTooltip = false; // Show volume tooltip on hover
	let showProgressTooltip = false; // Show progress tooltip on hover
	let progressTooltipPosition = 0; // Position of the progress tooltip
	let showSkipBackwardTooltip = false; // Show skip backward tooltip on hover
	let showPlayPauseTooltip = false; // Show play/pause tooltip on hover
	let showSkipForwardTooltip = false; // Show skip forward tooltip on hover
	let showFullScreenTooltip = false; // Show full-screen tooltip on hover
	let videoElement; // Store a reference to the video element
	let isFullScreen = false;

	// Tooltip delay variables
	let skipBackwardTooltipTimeout;
	let playPauseTooltipTimeout;
	let skipForwardTooltipTimeout;
	let fullScreenTooltipTimeout;

	let isAlmostDone = false; // Tracks if the video is almost done
	const ALMOST_DONE_THRESHOLD = 60; // 1 minute in seconds
	let almostDoneTimeoutId; // Store the timeout ID for the "almost done" notification
	const ALMOST_DONE_TIMEOUT = 3000; // 5 seconds
	let hasAlmostDoneTriggered = false; // Tracks if the "almost done" state has been triggered for the current video

	let message = null;
	let messageTimeout;

	function showMessage(text, duration = 3000) {
		message = text;
		clearTimeout(messageTimeout);
		messageTimeout = setTimeout(() => {
			message = null;
		}, duration);
	}

	let previousVideoUrl = null;
	$: if (videoUrl !== previousVideoUrl) {
		if (videoUrl) {
			// Check if videoUrl is truthy
			trace('New video URL:', videoUrl);
			hasAlmostDoneTriggered = false;
			isAlmostDone = false;
			// currentTime = 0;
			// duration = 0;
			// isPlaying = false;
			// ... reset other variables

			previousVideoUrl = videoUrl;
		}
	}

	// Function to hide song details after a delay
	const hideSongDetails = () => {
		showSongDetails = false; // Hide song details
	};

	// Function to hide controls after a delay
	const hideControlsAfterDelay = () => {
		clearTimeout(timeoutId); // Clear any existing timeout
		timeoutId = setTimeout(() => {
			showControls = false;
		}, 3000); // Hide controls after 3 seconds of inactivity
	};

	// Reset the timeout whenever the user interacts with the video
	const resetHideTimeout = () => {
		if (showControls) {
			hideControlsAfterDelay();
		}
	};

	// Cleanup on component unmount
	onMount(() => {
		// Add keyboard event listener
		window.addEventListener('keydown', handleKeyDown);

		videoElement = document.getElementById('karaoke-video'); // Get the video element
		// Add an 'error' event listener to the video element
		if (videoElement) {
			videoElement.addEventListener('error', handleVideoError);
		}

		return () => {
			// Remove the event listener when the component unmounts to prevent memory leaks
			if (videoElement) {
				videoElement.removeEventListener('error', handleVideoError);
			}

			if (timeoutId) {
				clearTimeout(timeoutId); // Clear the timeout when the component is destroyed
			}
			// Remove keyboard event listener
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	onDestroy(() => {
		videoElement = null;
	});

	function handleVideoError(error) {
		trace('Video Error:', error);

		dispatch('videoerror', {
			message: 'Error loading video.' // Or a more specific message if available
			// You can include other error details if needed (e.g., error.message, error.code)
		});

		// Optional: You could also set a fallback video URL or display an error message directly in the component
		// videoUrl = '/path/to/fallback/video.mp4';
		// or
		// showVideoError = true;
		duration = 0;
		showMessage('Error loading video.', 5000);
	}

	function formatTime(seconds) {
		if (isNaN(seconds) || seconds === undefined) {
			return '0:00'; // Or any other default you prefer
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
	}

	// Toggle play/pause
	const togglePlay = () => {
		// const video = document.getElementById('karaoke-video');
		if (isPlaying) {
			videoElement.pause();
		} else {
			videoElement.play();
		}
		isPlaying = !isPlaying;
	};

	// Skip backward
	const skipBackward = () => {
		// const video = document.getElementById('karaoke-video');
		videoElement.currentTime -= 10; // Skip back 10 seconds
	};

	// Skip forward
	const skipForward = () => {
		// const video = document.getElementById('karaoke-video');
		videoElement.currentTime += 10; // Skip forward 10 seconds
	};

	// Toggle full-screen mode
	const toggleFullScreen = () => {
		// const video = document.getElementById('karaoke-video');
		const video = document.getElementById('video-container');
		if (!document.fullscreenElement) {
			video.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	};

	const dispatch = createEventDispatcher(); // Create an event dispatcher

	// Update progress bar and current time
	const updateProgress = () => {
		// const video = document.getElementById('karaoke-video');
		currentTime = videoElement.currentTime;
		duration = videoElement.duration;

		// Check if videoElement and duration are available
		if (videoElement && videoElement.duration) {
			progressBarWidth = (currentTime / duration) * 100;

			// Check if the video is almost done
			if (duration - currentTime <= ALMOST_DONE_THRESHOLD) {
				if (!hasAlmostDoneTriggered) {
					// Only trigger this once per video
					isAlmostDone = true;
					hasAlmostDoneTriggered = true;

					//notify parent
					// Dispatch the 'almostdone' event
					trace('dispatching almostdone');
					dispatch('almostdone', {
						title: title,
						artist: artist
						// ... any other data you want to pass
					});
				}
			} else {
				// Reset the "almost done" state if the video is no longer in the threshold
				isAlmostDone = false;
			}

			// Check if the video has finished playing
			if (currentTime >= duration && duration > 0) {
				// Check duration to prevent NaN
				// Dispatch the 'ended' event
				trace('dispatching ended');
				dispatch('ended', {
					title: title,
					artist: artist
					// ... any other data you want to pass
				});
			}
		} else {
			currentTime = 0;
		}
	};

	let isDragging = false; // Flag to track dragging state

	function seekStart(event) {
		isDragging = true; // Set flag when mouse is down
		// seek(event); // Perform initial seek
	}

	function seeking(event) {
		if (isDragging) {
			// Only seek if dragging
			seek(event);
		}
	}

	function seekEnd() {
		isDragging = false; // Reset flag when mouse is up
	}

	function seek(event) {
		if (!videoElement || !duration || !progressBar) return;

		const rect = progressBar.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const seekTime = (clickX / rect.width) * duration;

		currentTime = seekTime;
		videoElement.currentTime = seekTime;
		updateProgress();
	}

	// Reset the "almost done" state
	const resetAlmostDoneState = () => {
		hasAlmostDoneTriggered = false; // Reset the flag
		isAlmostDone = false; // Hide the notification immediately
		clearTimeout(almostDoneTimeoutId); // Clear the timeout
		almostDoneTimeoutId = null; // Reset the timeout ID
	};

	// Seek to a specific time in the video
	// const seek = (event) => {
	// 	const video = document.getElementById('karaoke-video');
	// 	const progressBar = event.currentTarget;
	// 	const clickPosition = event.offsetX; // X coordinate of the click relative to the progress bar
	// 	const progressBarWidth = progressBar.offsetWidth; // Total width of the progress bar
	// 	const seekTime = (clickPosition / progressBarWidth) * duration; // Calculate the seek time
	// 	video.currentTime = seekTime; // Update the video's current time
	// };

	// Update volume
	const updateVolume = (event) => {
		// const video = document.getElementById('karaoke-video');
		volume = event.target.value; // Get the new volume value from the slider
		videoElement.volume = volume; // Update the video's volume
		isMuted = false; // Unmute if volume is adjusted
	};

	// Toggle mute/unmute
	const toggleMute = () => {
		// const video = document.getElementById('karaoke-video');
		if (isMuted) {
			// Unmute and restore the last volume setting
			videoElement.muted = false;
			volume = lastVolume;
			videoElement.volume = lastVolume;
		} else {
			// Mute and store the current volume setting
			lastVolume = volume;
			videoElement.muted = true;
		}
		isMuted = !isMuted;
	};

	// Function to stop the video
	export function stop() {
		if (videoElement) {
			videoElement.pause();
			videoElement.currentTime = 0;
		}
	}

	// Handle keyboard shortcuts
	const handleKeyDown = (event) => {
		switch (event.key) {
			case ' ':
				event.preventDefault(); // Prevent scrolling on spacebar press
				togglePlay();
				break;
			case 'ArrowLeft':
				skipBackward();
				break;
			case 'ArrowRight':
				skipForward();
				break;
			case 'm':
			case 'M':
				toggleMute();
				break;
			case 'f':
			case 'F':
				toggleFullScreen();
				break;
		}
	};

	// Format time (e.g., 65 => "01:05")
	// const formatTime = (time) => {
	// 	const minutes = Math.floor(time / 60);
	// 	const seconds = Math.floor(time % 60);
	// 	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	// };
</script>

<!-- Video player -->
{#if videoUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div id="video-container" class="h-full w-full relative bg-black" role="presentation">
		{#if message}
			<div
				class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/75 text-white px-4 py-2 rounded-lg z-10"
			>
				{message}
			</div>
		{/if}

		<video
			id="karaoke-video"
			class="w-full h-full object-contain"
			src={videoUrl}
			on:timeupdate={updateProgress}
			on:input={updateProgress}
			on:loadedmetadata={() => {
				duration = document.getElementById('karaoke-video').duration;
			}}
			on:mousedown={seekStart}
			on:mousemove={seeking}
			on:mouseup={seekEnd}
			autoplay
			controls
			bind:this={videoElement}
		>
			<source src={videoUrl} type="video/mp4" />
			<!-- Add a track element for accessibility -->
			<track kind="captions" src="" label="English" srclang="en" default />
			Your browser does not support the video tag.
		</video>

		<!-- Overlay Buttons -->
		<!-- <div class="absolute top-4 right-4 flex gap-2">
			<button
				class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
			>
				Button 1
			</button>
			<button
				class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
			>
				Button 2
			</button>
		</div> -->

		<!-- Almost Done Notification -->
		{#if isAlmostDone && nextSong != null}
			<div
				class="notification absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-4xl px-4 py-2 rounded
				animate whitespace-nowrap"
			>
				Playing next: {nextSong}
			</div>
		{/if}

		<!-- Full-screen overlay button -->
		<div class="absolute top-2 right-2">
			<button
				on:click={toggleFullScreen}
				on:mouseenter={() => (showFullScreenTooltip = true)}
				on:mouseleave={() => (showFullScreenTooltip = false)}
				class="absolute top-2 right-2 p-2 bg-black/50 text-white rounded hover:bg-black/70"
			>
				⛶
			</button>
			<!-- Full-screen Tooltip -->
			{#if showFullScreenTooltip}
				<div class="absolute -top-8 right-2 bg-black/75 text-white text-sm px-2 py-1 rounded">
					Fullscreen(F)
				</div>
			{/if}
		</div>

		<!-- Song details -->
		<div
			class="absolute top-2 left-2 p-2 bg-black/50 text-white rounded transition-opacity duration-1000"
			class:fade-out={!showSongDetails}
		>
			<p>{artist} - {title}</p>
		</div>

		{#if showControls && !videoElement.controls}
			<div
				class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between transition-opacity duration-300"
			>
				<div class="flex items-center w-full">
					<div class="flex items-center space-x-4 w-full">
						<button on:click={togglePlay} class="text-white text-2xl hover:text-gray-300">
							{isPlaying ? '⏸' : '▶'}
						</button>

						<div class="flex items-center flex-grow relative">
							<span class="text-white mr-2 text-sm">{formatTime(currentTime)}</span>
							<input
								type="range"
								min="0"
								max={duration}
								bind:value={currentTime}
								on:input={updateProgress}
								on:mousedown={seekStart}
								on:mousemove={seeking}
								on:mouseup={seekEnd}
								on:click={seek}
								bind:this={progressBar}
								class="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<span class="text-white ml-2 text-sm">{formatTime(duration)}</span>
							<div
								class="absolute top-0 left-0 h-full w-full cursor-pointer pointer-events-none"
								on:click={seek}
								role="presentation"
							></div>
						</div>

						<button on:click={toggleFullScreen} class="text-white text-2xl hover:text-gray-300">
							⛶
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<!-- <p class="text-[40px] text-slate-400">No video selected.</p> -->
	<div class="h-full w-full relative bg-slate-700 justify-center items-center flex">
		<i class="fas fa-video-slash text-9xl"></i>
		<!-- Font Awesome "no video" icon -->
	</div>
{/if}

<!-- Styles -->
<style>
	.fade-out {
		opacity: 0;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		button {
			padding: 4px 8px;
			font-size: 14px;
		}
		input[type='range'] {
			width: 60px; /* Smaller volume slider on mobile */
		}
	}

	.notification {
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.notification.animate {
		animation: scrollAndFade 15s linear forwards; /* Adjust duration as needed */
	}

	.notification.hidden {
		opacity: 0;
		pointer-events: none; /* Disable interactions when hidden */
	}

	@keyframes scrollRightToLeft {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(-200%);
		}
	}

	@keyframes scrollAndFade {
		0% {
			transform: translateX(100%); /* Start off-screen to the right */
			opacity: 0; /* Start fully transparent */
		}
		10% {
			opacity: 1; /* Fade in quickly */
		}
		90% {
			opacity: 1; /* Stay fully visible while scrolling */
		}
		100% {
			transform: translateX(-250%); /* End off-screen to the left */
			opacity: 0; /* Fade out at the end */
		}
	}
</style>
