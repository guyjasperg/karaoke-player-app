<!-- src/routes/config/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation'; // Import the navigate function
	import { browser } from '$app/environment';
	import { configStore } from '../../lib/stores/configStore.js';

	// Default settings (cannot be deleted)
	const defaultSettings = {
		apiBaseUrl: 'https://api.example.com', // Default API base URL
		websocketUrl: 'wss://ws.example.com' // Default WebSocket URL
	};

	// Reactive variables
	let customSettings = {}; // Stores custom settings added by the user
	let newSettingName = ''; // Holds the name of the new setting
	let newSettingValue = ''; // Holds the value of the new setting
	let isSaved = false; // Tracks whether the configuration is saved

	// Load saved configuration when the page loads
	onMount(() => {
		if (browser) {
			const savedConfig = JSON.parse(localStorage.getItem('backendConfig') || '{}');
			customSettings = savedConfig.customSettings || {};
		}
	});

	// Function to save the configuration
	function saveConfig() {
		if (browser) {
			const config = {
				...defaultSettings, // Include default settings
				customSettings // Include custom settings
			};
			localStorage.setItem('backendConfig', JSON.stringify(config));
			configStore.set(config); // Update the store
			isSaved = true;

			// Reset the saved message after 3 seconds
			setTimeout(() => (isSaved = false), 3000);
		}
	}

	// Function to add a new setting
	function addSetting() {
		if (newSettingName.trim() === '' || newSettingValue.trim() === '') {
			alert('Please enter both a setting name and value.');
			return;
		}

		// Check if the setting already exists (default or custom)
		if (defaultSettings[newSettingName] || customSettings[newSettingName]) {
			alert('A setting with this name already exists.');
			return;
		}

		// Add the new setting to custom settings
		customSettings = {
			...customSettings,
			[newSettingName]: newSettingValue
		};

		// Clear the input fields
		newSettingName = '';
		newSettingValue = '';
	}

	// Function to update a setting
	function updateSetting(key, value) {
		if (defaultSettings[key]) {
			// Update default setting
			defaultSettings[key] = value;
		} else if (customSettings[key]) {
			// Update custom setting
			customSettings = {
				...customSettings,
				[key]: value
			};
		}
	}

	// Function to delete a custom setting
	function deleteSetting(key) {
		if (defaultSettings[key]) {
			alert('Default settings cannot be deleted.');
			return;
		}

		// Remove the setting from custom settings
		const { [key]: _, ...rest } = customSettings;
		customSettings = rest;
	}

	// Function to navigate back to the karaoke route
	function goHome() {
		goto('/karaoke'); // Navigate to the karaoke route
	}
</script>

<main>
	<!-- Home button -->
	<div class="home-button-container">
		<button on:click={goHome} class="home-button">
			<i class="fas fa-home"></i>
			<!-- Font Awesome home icon -->
		</button>
	</div>

	<h1>Backend Configuration</h1>
	<p>Set and manage your backend configuration settings.</p>

	<!-- Configuration form -->
	<div class="config-form">
		<!-- Add new setting -->
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

		<!-- Display all settings -->
		<div class="settings-list">
			<h2>Current Settings</h2>
			{#each Object.entries({ ...defaultSettings, ...customSettings }) as [key, value]}
				<div class="setting-item">
					<label>{key}</label>
					<div class="input-container">
						<input type="text" bind:value on:input={(e) => updateSetting(key, e.target.value)} />
						{#if !defaultSettings[key]}
							<button on:click={() => deleteSetting(key)} class="delete-button">
								<i class="fas fa-trash"></i>
								<!-- Font Awesome trash icon -->
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Save configuration -->
		<button on:click={saveConfig}>Save Configuration</button>

		{#if isSaved}
			<p class="success-message">Configuration saved successfully!</p>
		{/if}
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 2rem;
		position: relative; /* For positioning the home button */
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.2rem;
		margin-bottom: 2rem;
	}

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

	/* Home button styles */
	.home-button-container {
		position: absolute;
		top: 1rem;
		left: 1rem;
	}

	.home-button {
		background-color: #6c757d; /* Gray color for the home button */
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.home-button:hover {
		background-color: #5a6268; /* Darker gray on hover */
	}
</style>
