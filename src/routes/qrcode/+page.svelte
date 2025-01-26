<!-- src/routes/qr-code/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import QRCode from '../../components/QRCode.svelte'; // Import the reusable QRCode component
	import qrcode from 'qrcode'; // Import the QR code library

	let inputText = ''; // Holds the user's input
	let qrCodeUrl = ''; // Holds the generated QR code URL
	let inputContainerWidth = 0; // Will store the width of the input container
	let isLoading = false; // Tracks whether the QR code is being generated

	// Function to generate the QR code
	async function generateQrCode() {
		if (inputText.trim() === '') {
			alert('Please enter some text to generate a QR code.');
			return;
		}

		isLoading = true; // Show loading spinner
		// await delay(3000); // Simulate a delay to show the loading spinner
		try {
			qrCodeUrl = await qrcode.toDataURL(inputText, {
				width: inputContainerWidth,
				height: inputContainerWidth
			});
		} catch (error) {
			console.error('Failed to generate QR code:', error);
			alert('Failed to generate QR code. Please try again.');
		} finally {
			isLoading = false; // Hide loading spinner
		}
	}

	// Function to download the QR code
	function downloadQrCode() {
		if (!qrCodeUrl) return;

		const link = document.createElement('a');
		link.href = qrCodeUrl;
		link.download = 'qrcode.png'; // Default filename for the downloaded image
		link.click();
	}

	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
</script>

<main>
	<h1>QR Code Generator</h1>
	<p>Enter text below to generate a QR code.</p>

	<!-- Body container with flex column -->
	<div class="body-container">
		<!-- Input container -->
		<div class="input-container" bind:clientWidth={inputContainerWidth}>
			<input type="text" bind:value={inputText} placeholder="Enter text or URL" />
			<button on:click={generateQrCode} disabled={isLoading}>
				{#if isLoading}
					Generating...
				{:else}
					Generate QR Code
				{/if}
			</button>
		</div>

		<!-- QR code container -->
		<div
			class="qr-code-container"
			style="width: {inputContainerWidth}px; height: {inputContainerWidth}px;"
		>
			{#if isLoading}
				<!-- Loading spinner -->
				<div class="spinner"></div>
			{:else if qrCodeUrl}
				<!-- Display the QR code -->
				<QRCode {qrCodeUrl} />
			{:else}
				<!-- Placeholder content -->
				<div class="placeholder">
					<p>Your QR code will appear here.</p>
					<p>👇</p>
				</div>
			{/if}
		</div>

		<!-- Download button (only shown when QR code is generated) -->
		{#if qrCodeUrl && !isLoading}
			<button on:click={downloadQrCode}>Download QR Code</button>
		{/if}
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.2rem;
		margin-bottom: 2rem;
	}

	/* Body container */
	.body-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem; /* Space between input container and QR code container */
		width: 100%; /* Occupy full width of the parent */
	}

	/* Input container */
	.input-container {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		width: 100%; /* Occupy full width of the parent */
		max-width: 600px; /* Optional: Limit the maximum width */
	}

	input {
		padding: 0.5rem;
		font-size: 1rem;
		width: 100%; /* Occupy full width of the input container */
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
		white-space: nowrap; /* Prevent button text from wrapping */
	}

	button:hover {
		background-color: #0056b3;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	/* QR code container */
	.qr-code-container {
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid #ccc; /* Optional: Add a border */
		border-radius: 8px; /* Optional: Add rounded corners */
		background-color: #f9f9f9; /* Light background for the placeholder */
	}

	.qr-code-container img {
		width: 100%;
		height: 100%;
		object-fit: contain; /* Ensures the QR code fits within the fixed size */
	}

	/* Placeholder styles */
	.placeholder {
		text-align: center;
		color: #666;
		font-size: 1.2rem;
	}

	.placeholder p {
		margin: 0.5rem 0;
	}

	/* Loading spinner */
	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		border-top: 4px solid #007bff;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
