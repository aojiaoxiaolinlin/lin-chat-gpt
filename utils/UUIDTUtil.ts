export function generateUUID() {
  const array = new Uint32Array(4)
  window.crypto.getRandomValues(array)
  let uuid = ''

  array.forEach((value) => {
    const segment = value.toString(16).padStart(8, '0')
    uuid += segment
  })

  return uuid
}
