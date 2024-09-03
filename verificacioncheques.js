document.getElementById('chequeForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita el envío por defecto del formulario

    // Verificar si se ha seleccionado un archivo
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        const fileType = file.name.split('.').pop().toLowerCase();
        if (fileType !== 'xls' && fileType !== 'xlsx') {
            alert('Por favor, seleccione un archivo de Excel.');
            return;
        }

        // Aquí podrías agregar más validaciones o procesamiento del archivo si es necesario

        // Resetear el formulario después de guardar
        document.getElementById('chequeForm').reset();

        // Cierra la ventana actual (asumiendo que está en una ventana de Electron)
        window.close();
    } else {
        alert('Por favor, seleccione un archivo.');
    }
});
