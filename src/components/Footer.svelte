<script>
	export let message = ''; // Default title
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
	</div>
</footer>
