document.addEventListener('DOMContentLoaded', () => {
    const empresasSelect = document.getElementById('empresas');
    const loadButton = document.getElementById('loadButton');
    const saveButton = document.getElementById('saveButton');
    const fileInput = document.getElementById('fileInput');
    const fileStatus = document.getElementById('fileStatus');

    let chequesData = null;
    let isProcessing = false;

    // Cargar empresas
    window.api.getEmpresas().then((empresas) => {
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nombre;
            empresasSelect.appendChild(option);
        });
    });

    // Manejar carga de archivo
    loadButton.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        saveButton.disabled = true;
        fileStatus.textContent = 'Cargando archivo...';

        try {
            chequesData = await window.api.loadCheques();
            
            if (chequesData && chequesData.length > 0) {
                fileStatus.textContent = `Archivo cargado. ${chequesData.length} cheques válidos encontrados.`;
                saveButton.disabled = false;
            } else {
                fileStatus.textContent = 'No se encontraron datos válidos en el archivo.';
            }
        } catch (error) {
            console.error('Error al cargar o procesar cheques:', error);
            fileStatus.textContent = `Error: ${error.message}`;
        } finally {
            isProcessing = false;
        }
    });

    // Manejar guardado de cheques
    saveButton.addEventListener('click', async () => {
        if (isProcessing || !chequesData) return;
        isProcessing = true;
        saveButton.disabled = true;
        fileStatus.textContent = 'Actualizando cheques...';
    
        const empresa = empresasSelect.value;
        if (!empresa) {
            alert('Debe seleccionar una empresa');
            isProcessing = false;
            saveButton.disabled = false;
            return;
        }
    
        try {
            const result = await window.api.updateCheques(chequesData, empresa);
            if (result.success) {
                alert(`Cheques actualizados exitosamente. ${result.count} cheques procesados.`);
            } else {
                // Mostrar el mensaje de error en la UI
                fileStatus.textContent = `Error: ${result.error}`;
                alert(`Error al actualizar cheques: ${result.error}`);
            }
        } catch (error) {
            console.error('Error inesperado al actualizar cheques:', error);
            alert(`Error inesperado: ${error.message}`);
        } finally {
            isProcessing = false;
            saveButton.disabled = !chequesData;
        }
    });
    
});
