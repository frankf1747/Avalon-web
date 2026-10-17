// Stand-ins for the Firestore-backed hooks; data comes from the demo scenario.
export const useRoom = () => ({ room: window.__demo.room, error: null })
export const useEvents = () => window.__demo.events
export const useSecret = () => window.__demo.secret
export const useAuth = () => ({ uid: window.__demo.me.uid })
