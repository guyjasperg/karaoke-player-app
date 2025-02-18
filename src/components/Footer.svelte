<script>
	export let message = ''; // Default title
	export let isSocketConnected = false;
	export let config = null;
	const currentYear = new Date().getFullYear();
</script>

<footer
	class="w-full h-full bg-gray-800 text-white flex items-end justify-end sm:items-center sm:justify-center"
>
	<div class="flex flex-col items-end px-2 sm:items-center sm:px-0">
		<p class="text-sm text-slate-500 hidden sm:inline">
			&copy; {currentYear} My App. All rights reserved.
		</p>
		<span class="text-sm text-slate-500 sm:hidden">My App</span>
		<p class="text-xs text-slate-600">
			{message}
		</p>
		{#if config}
			<div class="absolute text-xs text-slate-600 left-0 p-2">
				<p class="text-xs text-slate-600">
					{config.fileServer}
				</p>
				<p>asdas</p>
			</div>
		{/if}
		<div class="flex items-center justify-center gap-2">
			<span
				id="ledStat"
				class="inline-flex items-center rounded-full p-0.5 shadow-md transition-all duration-300"
				class:bg-green-100={isSocketConnected}
				class:bg-red-100={!isSocketConnected}
			>
				<span
					class="h-2 w-2 rounded-full shadow-inner transition-all duration-300"
					class:bg-green-600={isSocketConnected}
					class:bg-red-600={!isSocketConnected}
				></span>
			</span>

			<p class="text-xs text-slate-600">Socket</p>
		</div>
	</div>
</footer>
