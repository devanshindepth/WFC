export function get(url) {
    return fetch(url).then(response => response.json())
}