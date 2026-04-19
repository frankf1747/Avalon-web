// Audio narration: prefer local mp3 (drop-in at public/audio/<key>.mp3);
// fall back to browser Web Speech API (zh-CN) when the file is missing.

const fileCache = new Map() // url -> 'ok' | 'missing'

async function fileExists(url) {
  if (fileCache.has(url)) return fileCache.get(url) === 'ok'
  try {
    const r = await fetch(url, { method: 'HEAD' })
    const ok = r.ok
    fileCache.set(url, ok ? 'ok' : 'missing')
    return ok
  } catch { fileCache.set(url, 'missing'); return false }
}

function speakTTS(text) {
  if (!('speechSynthesis' in window)) return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 0.9; u.volume = 1
    const voices = speechSynthesis.getVoices()
    const zh = voices.find(v => v.lang?.toLowerCase().startsWith('zh'))
    if (zh) u.voice = zh
    speechSynthesis.speak(u)
  } catch {}
}

let current = null
export async function narrate({ audio, text }) {
  stopNarration()
  if (audio && await fileExists(audio)) {
    const el = new Audio(audio)
    current = el
    el.play().catch(() => speakTTS(text))
    return
  }
  speakTTS(text)
}

export function stopNarration() {
  try { current?.pause?.(); current = null } catch {}
  try { speechSynthesis?.cancel?.() } catch {}
}

export function chime(freq = 523) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)
    o.start(); o.stop(ctx.currentTime + 0.9)
  } catch {}
}
