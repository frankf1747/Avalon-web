export const db = {}
export const auth = { currentUser: { uid: 'p1' } }
export async function ensureAuth() { return auth.currentUser }
