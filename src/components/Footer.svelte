<script>
	export let message = ''; // Default title
	export let isSocketConnected = false;
	const currentYear = new Date().getFullYear();
</script>

<footer class="w-full h-full bg-gray-800 text-white flex items-center justify-center">
	<div class="flex flex-col items-center justify-center">
		<p class="text-sm md:text-base text-slate-500">
			&copy; {currentYear} My App. All rights reserved.
		</p>
		<p class="text-xs text-slate-600">
			{message}
		</p>
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
