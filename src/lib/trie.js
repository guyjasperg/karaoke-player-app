import { writable } from 'svelte/store';
import Trie from './TrieClass';

export const trie = writable(null); // Initialize as null

// Function to populate the Trie (call this only once)
export async function initializeTrie() {
    console.log("initializeTrie...");
  if (get(trie) === null) { // Check if already initialized
    const newTrie = new Trie();
    try {
    //   const data = await fetchDataFromDatabase(); // Your data fetching logic
    //   data.forEach(item => newTrie.insert(item));

        newTrie.insert("Taylor Swift");
        newTrie.insert("The Weeknd");
        newTrie.insert("Adele");
        newTrie.insert("Ed Sheeran");

      trie.set(newTrie); // Update the store
    } catch (error) {
      console.error("Error initializing Trie:", error);
      // Handle error (e.g., set a default Trie, display a message)
      trie.set(new Trie()); // Or some default trie
    }
  }
}