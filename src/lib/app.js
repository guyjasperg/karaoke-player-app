import { initializeTrie } from "./trie";

// Call initializeTrie *once* when your app starts.  hooks.js is a great place for this
export const handle = async ({ event, resolve }) => {
    console.log("Initializing Trie...");
    await initializeTrie();
    const response = await resolve(event);
    return response;
}