<script>
	import { onMount, createEventDispatcher } from 'svelte';

	// Props
	export let videoUrl = ''; // Video URL (filepath) passed from parent
	export let artist = ''; // Artist name passed from parent
	export let title = ''; // Song title passed from parent

	// Reactive variables
	let isPlaying = false;
	let showControls = false; // Controls are hidden by default
	let showSongDetails = true; // Controls visibility of song details
	let timeoutId; // Store the timeout ID for cleanup
	let currentTime = 0; // Current playback time
	let duration = 0; // Total duration of the video
	let progressBarWidth = 0; // Width of the progress bar (0-100%)
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

	let previousVideoUrl = null;
	$: if (videoUrl !== previousVideoUrl) {
		if (videoUrl) {
			// Check if videoUrl is truthy
			console.log('New video URL:', videoUrl);
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

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId); // Clear the timeout when the component is destroyed
			}
			// Remove keyboard event listener
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	// Toggle play/pause
	const togglePlay = () => {
		const video = document.getElementById('karaoke-video');
		if (isPlaying) {
			video.pause();
		} else {
			video.play();
		}
		isPlaying = !isPlaying;
	};

	// Skip backward
	const skipBackward = () => {
		const video = document.getElementById('karaoke-video');
		video.currentTime -= 10; // Skip back 10 seconds
	};

	// Skip forward
	const skipForward = () => {
		const video = document.getElementById('karaoke-video');
		video.currentTime += 10; // Skip forward 10 seconds
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
		const video = document.getElementById('karaoke-video');
		currentTime = video.currentTime;
		duration = video.duration;
		progressBarWidth = (currentTime / duration) * 100;

		// Check if the video is almost done
		if (duration - currentTime <= ALMOST_DONE_THRESHOLD) {
			if (!hasAlmostDoneTriggered) {
				// Only trigger this once per video
				isAlmostDone = true;
				hasAlmostDoneTriggered = true;

				//notify parent
				// Dispatch the 'almostdone' event
				console.log('dispatching almostdone');
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
			console.log('dispatching ended');
			dispatch('ended', {
				title: title,
				artist: artist
				// ... any other data you want to pass
			});
		}
	};

	// Reset the "almost done" state
	const resetAlmostDoneState = () => {
		hasAlmostDoneTriggered = false; // Reset the flag
		isAlmostDone = false; // Hide the notification immediately
		clearTimeout(almostDoneTimeoutId); // Clear the timeout
		almostDoneTimeoutId = null; // Reset the timeout ID
	};

	// Seek to a specific time in the video
	const seek = (event) => {
		const video = document.getElementById('karaoke-video');
		const progressBar = event.currentTarget;
		const clickPosition = event.offsetX; // X coordinate of the click relative to the progress bar
		const progressBarWidth = progressBar.offsetWidth; // Total width of the progress bar
		const seekTime = (clickPosition / progressBarWidth) * duration; // Calculate the seek time
		video.currentTime = seekTime; // Update the video's current time
	};

	// Update volume
	const updateVolume = (event) => {
		const video = document.getElementById('karaoke-video');
		volume = event.target.value; // Get the new volume value from the slider
		video.volume = volume; // Update the video's volume
		isMuted = false; // Unmute if volume is adjusted
	};

	// Toggle mute/unmute
	const toggleMute = () => {
		const video = document.getElementById('karaoke-video');
		if (isMuted) {
			// Unmute and restore the last volume setting
			video.muted = false;
			volume = lastVolume;
			video.volume = lastVolume;
		} else {
			// Mute and store the current volume setting
			lastVolume = volume;
			video.muted = true;
		}
		isMuted = !isMuted;
	};

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
	const formatTime = (time) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};
</script>

<!-- Video player -->
{#if videoUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		id="video-container"
		class="h-full w-full relative bg-slate-700"
		on:mouseenter={() => (showControls = true)}
		on:mouseleave={() => (showControls = false)}
		on:mousemove={resetHideTimeout}
		role="presentation"
	>
		<video
			id="karaoke-video"
			class="w-full h-full object-contain"
			src={videoUrl}
			on:timeupdate={updateProgress}
			on:loadedmetadata={() => {
				duration = document.getElementById('karaoke-video').duration;
			}}
			on:click={togglePlay}
			autoplay
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
		<div
			class="notification absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-sm px-4 py-2 rounded {isAlmostDone
				? 'animate'
				: 'hidden'}"
		>
			Almost done! Only 1 minute left.
		</div>

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

		<!-- Conditional rendering for controls -->
		{#if showControls}
			<!-- Progress Bar -->
			<div class="absolute bottom-20 left-2 right-2 p-2 bg-black/50 rounded">
				<div
					class="w-full h-2 bg-gray-600 rounded-full cursor-pointer relative"
					on:click={seek}
					on:mousemove={(e) => {
						showProgressTooltip = true;
						const progressBar = e.currentTarget;
						const clickPosition = e.offsetX;
						const progressBarWidth = progressBar.offsetWidth;
						progressTooltipPosition = (clickPosition / progressBarWidth) * 100;
					}}
					on:mouseleave={() => (showProgressTooltip = false)}
					role="presentation"
				>
					<div class="h-2 bg-blue-500 rounded-full" style={`width: ${progressBarWidth}%`}></div>
					<!-- Progress Tooltip -->
					{#if showProgressTooltip}
						<div
							class="absolute -top-8 transform -translate-x-1/2 bg-black/75 text-white text-sm px-2 py-1 rounded"
							style={`left: ${progressTooltipPosition}%`}
						>
							{formatTime((progressTooltipPosition / 100) * duration)}
						</div>
					{/if}
				</div>
			</div>

			<!-- Volume Control (Absolute Positioning with Higher z-index) -->
			<div class="absolute bottom-4 left-4 flex items-center gap-2 z-20">
				<button
					on:click={toggleMute}
					class="text-white p-3 rounded-full hover:scale-125 transition duration-200 text-xl"
				>
					{isMuted ? '🔇' : '🔊'}
				</button>
				<div
					class="relative"
					on:mouseenter={() => (showVolumeTooltip = true)}
					on:mouseleave={() => (showVolumeTooltip = false)}
					role="presentation"
				>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={volume}
						on:input={updateVolume}
						class="w-20 cursor-pointer {isMuted ? 'opacity-50 cursor-not-allowed' : ''}"
						disabled={isMuted}
					/>
					<!-- Volume Tooltip -->
					{#if showVolumeTooltip}
						<div
							class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-sm px-2 py-1 rounded"
						>
							{Math.round(volume * 100)}%
						</div>
					{/if}
				</div>
			</div>

			<!-- Playback Controls (Centered) -->
			<div
				id="videoControls"
				class="absolute bottom-0 left-0 right-0 flex items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent z-10"
			>
				<div class="flex items-center space-x-4">
					<!-- Skip Backward Button -->
					<div class="relative">
						<button
							id="skipBackward"
							on:click={skipBackward}
							on:mouseenter={() => {
								clearTimeout(skipBackwardTooltipTimeout);
								showSkipBackwardTooltip = true;
							}}
							on:mouseleave={() => {
								skipBackwardTooltipTimeout = setTimeout(
									() => (showSkipBackwardTooltip = false),
									200
								);
							}}
							class="text-white p-3 rounded-full hover:scale-125 transition duration-200 text-xl"
						>
							&lt; <!-- "<" icon -->
						</button>
						<!-- Skip Backward Tooltip -->
						{#if showSkipBackwardTooltip}
							<div
								class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-sm px-2 py-1 rounded"
							>
								Backward (←)
							</div>
						{/if}
					</div>

					<!-- Play/Pause Button -->
					<div class="relative">
						<button
							id="playPauseButton"
							on:click={togglePlay}
							on:mouseenter={() => {
								clearTimeout(playPauseTooltipTimeout);
								showPlayPauseTooltip = true;
							}}
							on:mouseleave={() => {
								playPauseTooltipTimeout = setTimeout(() => (showPlayPauseTooltip = false), 200);
							}}
							class="text-white p-3 rounded-full hover:scale-150 transition duration-200 text-xl"
						>
							{isPlaying ? '⏸' : '▶'}
							<!-- Play/Pause icon -->
						</button>
						<!-- Play/Pause Tooltip -->
						{#if showPlayPauseTooltip}
							<div
								class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-sm px-2 py-1 rounded"
							>
								{isPlaying ? 'Pause (Space)' : 'Play (Space)'}
							</div>
						{/if}
					</div>

					<!-- Skip Forward Button -->
					<div class="relative">
						<button
							id="skipForward"
							on:click={skipForward}
							on:mouseenter={() => {
								clearTimeout(skipForwardTooltipTimeout);
								showSkipForwardTooltip = true;
							}}
							on:mouseleave={() => {
								skipForwardTooltipTimeout = setTimeout(() => (showSkipForwardTooltip = false), 200);
							}}
							class="text-white p-3 rounded-full hover:scale-125 transition duration-200 text-xl"
						>
							&gt; <!-- ">" icon -->
						</button>
						<!-- Skip Forward Tooltip -->
						{#if showSkipForwardTooltip}
							<div
								class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-sm px-2 py-1 rounded"
							>
								Forward (→)
							</div>
						{/if}
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
