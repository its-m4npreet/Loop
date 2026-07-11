export async function logout() {
  try {
    await fetch('/api/auth/signout', { method: 'POST' })
  } catch {}

  localStorage.clear()
  sessionStorage.clear()

  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`
  })

  window.location.replace('/')
}
