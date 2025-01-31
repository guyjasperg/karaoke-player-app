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
