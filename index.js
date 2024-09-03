// index.js (archivo JS que se carga en index.html)
document.getElementById('newWindowBtn').addEventListener('click', () => {
    window.electronAPI.openIngresarWindow();
});
