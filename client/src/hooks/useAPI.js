// Placeholder — will be implemented in Phase 3 (Auth + Cloud Saves)
// Will provide fetch wrapper with JWT injection
export function useAPI() {
  return { fetch: window.fetch.bind(window) };
}
