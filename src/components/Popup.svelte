<script>
	export let message = '';
	export let type = 'info'; // 'info', 'success', 'error'
	export let visible = false;

	// Automatically hide the popup after a delay
	$: if (visible) {
		setTimeout(() => {
			visible = false; // Reset visible to false after the popup disappears
		}, 3000); // Hide after 3 seconds
	}
</script>

{#if visible}
	<div class="popup {type}">
		{message}
	</div>
{/if}

<style>
	.popup {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		padding: 10px 20px;
		border-radius: 5px;
		color: white;
		z-index: 1000;
		opacity: 0.9;
		animation: fadeIn 0.3s ease-in-out;
	}

	.info {
		background-color: #3498db;
	}

	.success {
		background-color: #2ecc71;
	}

	.error {
		background-color: #e74c3c;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, -20px);
		}
		to {
			opacity: 0.9;
			transform: translate(-50%, 0);
		}
	}
</style>
