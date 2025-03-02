<!-- src/routes/config/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	// import { get } from 'svelte/store';
	import { configStore } from '../../lib/stores/configStore.js';
	import Header from '../../components/Header.svelte';
	import Footer from '../../components/Footer.svelte';
	import { createLogger } from '$lib/logger';
	const trace = createLogger('config');

	// Reactive variables
	let customSettings = {};
	let newSettingName = '';
	let newSettingValue = '';
	let isSaved = false;
	let config;

	// Subscribe to the config store
	configStore.subscribe((value) => {
		console.log('configStore.subscribe()');
		// config = value;
		// console.log('Current configuration:', value);
		config = value;
	});

	// Default settings (cannot be deleted)
	// const defaultSettings = {
	// 	apiBaseUrl: 'https://api.example.com',
	// 	websocketUrl: 'wss://ws.example.com',
	// 	fileServer: 'http://localhost:3000/videos/'
	// };

	onMount(() => {
		trace('Config page mounted');
		if (browser) {
			const savedConfig = JSON.parse(localStorage.getItem('backendConfig') || '{}');
			trace('Saved configuration:', savedConfig);
			// customSettings = savedConfig.customSettings || {};
		}
	});

	function saveConfig() {
		trace('saveConfig()');
		if (browser) {
			// const config = {
			// 	...defaultSettings
			// 	// customSettings
			// };
			const inputs = document.querySelectorAll('.settings-list input');
			inputs.forEach((input) => {
				const key = input.dataset.key;
				const value = input.value;
				trace('Setting:', key, value);
				config[key] = value;
			});

			trace('Saving configuration:', config);
			localStorage.setItem('backendConfig', JSON.stringify(config));
			configStore.set(config);
			isSaved = true;
			setTimeout(() => (isSaved = false), 3000);
		}
	}

	function addSetting() {
		if (!newSettingName.trim() || !newSettingValue.trim()) {
			alert('Please enter both a setting name and value.');
			return;
		}

		if (defaultSettings[newSettingName] || customSettings[newSettingName]) {
			alert('A setting with this name already exists.');
			return;
		}

		customSettings = {
			...customSettings,
			[newSettingName]: newSettingValue
		};

		newSettingName = '';
		newSettingValue = '';
	}

	function updateSetting(key, value) {
		// trace('Updating setting:', key, value);
		if (config.hasOwnProperty(key)) {
			// config[key] = value;
		} else {
			console.warn(
				`Key "${key}" not found in customSettings. Consider adding it or checking for typos.`
			);
			// Or, if you want to add the key if it doesn't exist:
			// customSettings[key] = value; // Uncomment to add the key if it's missing
		}
	}

	function deleteSetting(key) {
		const { [key]: _, ...rest } = customSettings;
		customSettings = rest;
	}

	function goHome() {
		goto('/karaoke');
	}

	function resetLocalStorage() {
		localStorage.clear();
		alert('Local storage has been reset.');
		trace('Local storage has been reset.');
	}
</script>

<main class="h-screen flex flex-col">
	<div class=" bg-slate-500 flex items-center justify-center">
		<Header title="Backend Configuration" subtitle="Add/update settings for the app." />
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		<div class="config-form">
			<div class="hidden">
				<div class="form-group">
					<label for="newSettingName">New Setting Name</label>
					<input
						type="text"
						id="newSettingName"
						bind:value={newSettingName}
						placeholder="Enter setting name"
					/>
				</div>

				<div class="form-group">
					<label for="newSettingValue">New Setting Value</label>
					<input
						type="text"
						id="newSettingValue"
						bind:value={newSettingValue}
						placeholder="Enter setting value"
					/>
				</div>

				<button on:click={addSetting}>Add Setting</button>
			</div>

			<div class="settings-list">
				<h2>Current Settings</h2>
				<!-- {#each Object.entries({ ...defaultSettings, ...customSettings }) as [key, value]} -->
				{#each Object.entries({ ...config }) as [key, value]}
					<div class="setting-item">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label>{key}</label>
						<div class="input-container">
							<input type="text" {value} data-key={key} data-value={value} />
						</div>
					</div>
				{/each}
			</div>

			<button on:click={saveConfig}>Save Configuration</button>
			<button on:click={resetLocalStorage}>Reset Local Storage</button>

			{#if isSaved}
				<p class="success-message">Configuration saved successfully!</p>
			{/if}
		</div>
	</div>

	<div class="h-[10%] bg-blue-200 flex items-center justify-center">
		<Footer />
	</div>
</main>

<style>
	.config-form {
		max-width: 600px;
		margin: 0 auto;
		text-align: left;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		font-size: 1rem;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		text-align: left; /* Left-align text inside inputs */
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		margin-right: 0.5rem;
	}

	button:hover {
		background-color: #0056b3;
	}

	.delete-button {
		background-color: #dc3545;
		padding: 0.5rem; /* Smaller padding for compact size */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-button:hover {
		background-color: #c82333;
	}

	.settings-list {
		margin-top: 2rem;
	}

	.setting-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.setting-item label {
		flex: 1;
		font-weight: bold;
		text-align: left; /* Left-align labels */
	}

	.input-container {
		flex: 2;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.input-container input {
		flex: 1; /* Input takes up remaining space */
	}

	.success-message {
		margin-top: 1rem;
		color: green;
		font-weight: bold;
	}
</style>
