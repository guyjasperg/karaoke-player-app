<!-- src/lib/components/QRCode.svelte -->
<script>
	export let qrCodeUrl; // This prop will hold the URL or data for the QR code
</script>

<div class="qr-code-container">
	<img src={qrCodeUrl} alt="QR Code" />
</div>

<style>
	.qr-code-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	img {
		max-width: 100%;
		height: auto;
	}
</style>
