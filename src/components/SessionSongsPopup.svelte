<script>
	import { onMount, onDestroy } from 'svelte'; // Import lifecycle functions

	export let sessionId = ''; // The sessionId to display
	export let songs = []; // List of songs for the session
	export let visible = false; // Controls modal visibility

	// Function to close the modal
	const closeModal = () => {
		visible = false;
	};

	// Close the modal when the Escape key is pressed
	const handleKeyDown = (event) => {
		if (event.key === 'Escape') {
			closeModal();
		}
	};

	// Add event listener for the Escape key (only in the browser)
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
		}
	});

	// Remove event listener when the component is destroyed
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

{#if visible}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore element_invalid_self_closing_tag -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50" on:click={closeModal} />

	<!-- Modal -->
	<div
		class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 max-h-[80vh] bg-white rounded-lg shadow-lg z-50 overflow-y-auto p-5"
	>
		<!-- Close Button -->
		<button
			class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
			on:click={closeModal}
		>
			&times;
		</button>

		<!-- Title -->
		<h3 class="text-xl font-semibold text-center text-gray-800 mt-0">Songs in Session</h3>

		<!-- Line under the title -->
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="w-full h-px bg-gray-200 my-2" />

		<!-- List of songs -->
		<ul class="list-none p-0 m-0">
			{#each songs as song}
				<li class="p-2 border-b border-gray-200 text-sm text-gray-700 last:border-b-0">
					{song.Artist} - {song.Title}
				</li>
			{/each}
		</ul>
	</div>
{/if}
