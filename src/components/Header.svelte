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

	let showMenu = false; // State for mobile menu toggle

	// Function to toggle the mobile menu
	const toggleMenu = () => {
		console.log('toggleMenu');
		showMenu = !showMenu;
	};

	const closeMenu = () => {
		showMenu = false;
	};
</script>

<header class="w-full bg-gray-800 shadow-md {isSticky ? 'sticky top-0 z-50' : ''}">
	<div class="flex">
		<nav class="bg-gray-800 border-gray-200 dark:bg-gray-900 w-full text-slate-100">
			<div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 pl-8">
				<div class="flex items-center space-x-3 rtl:space-x-reverse">
					<!-- Change icon below -->
					<!-- <img src="https://flowbite.com/docs/images/logo.svg" class="h-8" alt="Flowbite Logo" /> -->
					<span
						class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white cursor-default"
						>{title}</span
					>
				</div>
				<button
					on:click={toggleMenu}
					type="button"
					class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
					aria-controls="navbar-default"
					aria-expanded={showMenu}
				>
					<span class="sr-only">Open main menu</span>
					<svg
						class="w-5 h-5"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 17 14"
					>
						<path
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M1 1h15M1 7h15M1 13h15"
						/>
					</svg>
				</button>
				<div
					class={`w-full bg-slate-800 mt-2 md:block md:w-auto ${showMenu ? 'block z-40' : 'hidden'} `}
					id="navbar-default"
				>
					<ul
						class="font-medium flex flex-col p-2 md:p-0 rounded-lg md:flex-row md:justify-end space-y-3 md:space-y-0 md:space-x-2 z-40"
					>
						{#each navLinks as link}
							<li>
								<a
									href={link.path}
									on:click|stopPropagation
									class="hover:text-blue-500 transition-colors {$page.url.pathname === link.path
										? 'pointer-events-none opacity-30'
										: ''} block py-2 px-2"
								>
									{link.name}
								</a>
							</li>
						{/each}
					</ul>
				</div>
				{#if showMenu}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="fixed top-0 left-0 w-full h-full z-30 bg-black/50"
						on:click={closeMenu}
						role="presentation"
					></div>
				{/if}
			</div>
		</nav>
	</div>
</header>
