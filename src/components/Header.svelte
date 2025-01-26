<script>
	import { page } from '$app/stores'; // SvelteKit's page store
	export let title = 'My App'; // Default title
	export let subtitle = ''; // Default title
	export let showLogo = true; // Show/hide the logo
	export let showNav = true; // Show/hide the navigation links
	export let isSticky = false; // Make the header sticky
	export let bgColor = 'bg-gray-800'; // Default background color
	export let textColor = 'text-white'; // Default text color
	export let navLinks = [
		// Default navigation links
		{ name: 'Home', path: '/' },
		{ name: 'Karaoke Player', path: '/karaoke' },
		{ name: 'Queue', path: '/queue' },
		{ name: 'Settings', path: '/config' }
	];

	let isMenuOpen = false; // State for mobile menu toggle

	// Function to toggle the mobile menu
	const toggleMenu = () => {
		isMenuOpen = !isMenuOpen;
	};
</script>

<header
	class="w-full h-full {bgColor} {textColor}   shadow-md flex items-center {isSticky
		? 'sticky top-0 z-50'
		: ''}"
>
	<nav class="container mx-auto flex flex-col md:flex-row justify-between items-center p-4">
		<!-- Logo and Hamburger Menu (Mobile) -->
		<div class="flex justify-between items-center w-full md:w-auto">
			{#if showLogo}
				<div class="flex flex-col justify-center items-start gap-1">
					<div class="text-xl font-bold">{title}</div>
					{#if subtitle !== ''}
						<div class="text-sm">{subtitle}</div>
					{/if}
				</div>
			{/if}

			{#if showNav}
				<button class="md:hidden" on:click={toggleMenu}>
					<i class="fas fa-bars text-2xl"></i>
					<!-- Font Awesome hamburger icon -->
				</button>
			{/if}
		</div>

		<!-- Navigation Links -->
		{#if showNav}
			<ul
				class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mt-4 md:mt-0 {isMenuOpen
					? 'block'
					: 'hidden md:flex'}"
			>
				{#each navLinks as link}
					<li>
						<a
							href={link.path}
							class="hover:text-yellow-300 transition-colors {$page.url.pathname === link.path
								? 'pointer-events-none opacity-30'
								: ''}"
						>
							{link.name}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</nav>
</header>
