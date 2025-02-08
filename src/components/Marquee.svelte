<script>
	export let text;
	export let speed = 0.2;
	export let fadeDuration = 3000;

	let marqueeWidth = 0;
	let animationDuration = 0;
	let showMarquee = true;

	$: if (text) {
		marqueeWidth = document.getElementById('marquee')?.offsetWidth || 0;
		// animationDuration = text.length * speed;
		animationDuration = 10;
		showMarquee = true;

		setTimeout(() => {
			showMarquee = false;
		}, fadeDuration);
	}
</script>

{#if showMarquee}
	<div
		class="overflow-hidden whitespace-nowrap transition-opacity duration-500 ease-in-out animate-fade-out"
	>
		<div id="marquee" class="animate-marquee" style="animation-duration: {animationDuration}s;">
			{text}
		</div>
	</div>
{/if}

<style>
	.animate-marquee {
		animation: marquee var(--marquee-duration) linear infinite;
	}

	@keyframes marquee {
		0% {
			transform: translateX(100%);
		}
		100% {
			transform: translateX(-100%);
		}
	}

	.animate-fade-out {
		animation: fadeOut 10s ease-in-out forwards; /* Adjust duration here */
	}

	@keyframes fadeOut {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
