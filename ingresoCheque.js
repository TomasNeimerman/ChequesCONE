document.addEventListener('DOMContentLoaded', () => {
    const empresasSelect = document.getElementById('empresas');
    const loadButton = document.getElementById('loadButton');
    const saveButton = document.getElementById('saveButton');
    const empresaStatus = document.getElementById('empresaStatus');
    const fileStatus = document.getElementById('fileStatus');
    
    let empresaId = null;
    let chequesData = null;
    let isProcessing = false;

    // Cargar empresas al inicio
    window.api.getEmpresas().then((empresas) => {
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nombre;
            empresasSelect.appendChild(option);
        });
    });

    empresasSelect.addEventListener('change', async () => {
        const selectedEmpresa = empresasSelect.value;
        if (!selectedEmpresa) {
            empresaStatus.textContent = "Seleccione una empresa.";
            return;
        }

        try {
            // Verificar existencia de la tabla en el backend
            const tableExists = await window.api.checkTableExists(selectedEmpresa);

            if (tableExists) {
                empresaStatus.textContent = `La empresa ${selectedEmpresa} existe en la base de datos.`;
                empresaId = selectedEmpresa
            } else {
                empresaStatus.textContent = `No existe la tabla para la empresa ${selectedEmpresa} en la base de datos.`;
            }
        } catch (error) {
            console.error('Error al verificar la tabla de la empresa:', error);
            empresaStatus.textContent = `Error al verificar la empresa: ${error.message}`;
        }
    });

    // Manejar el click en el botón de cargar Excel
    loadButton.addEventListener('click', async () => {
        const empresaSeleccionada = empresasSelect.value;
        if (!empresaSeleccionada) {
            alert('Por favor, seleccione una empresa antes de cargar el archivo');
            return;
        }
        
        try {
            // Llamar a la función loadCheques del main process
            chequesData = await window.api.loadCheques();
            
            if (!chequesData) {
                fileStatus.textContent = 'No se seleccionó ningún archivo o el archivo está vacío';
                return;
            }

            // Extraer los IDs de cheques
            const chequeIds = chequesData.map(cheque => cheque.idCheque);
            
            // Verificar los cheques contra la base de datos
            
            const verificationResults = await window.api.verifyCheques(chequeIds, empresaId);
            
            // Mostrar resultados de la verificación
            const chequesExistentes = verificationResults.filter(r => r.exists).length;
            const chequesNoExistentes = verificationResults.filter(r => !r.exists).length;
            
            let mensaje = `Archivo cargado exitosamente.\n`;
            mensaje += `Verificación completada:\n`;
            mensaje += `${chequesExistentes} cheques encontrados\n`;
            mensaje += `${chequesNoExistentes} cheques no encontrados`;
            
            if (chequesNoExistentes > 0) {
                const chequesNoEncontrados = verificationResults
                    .filter(r => !r.exists)
                    .map(r => r.idCheque)
                    .join(', ');
                mensaje += `\nCheques no encontrados: ${chequesNoEncontrados}`;
            }
            
            fileStatus.textContent = mensaje;
            saveButton.disabled = chequesExistentes === 0;
            
        } catch (error) {
            console.error('Error al cargar el archivo:', error);
            fileStatus.textContent = `Error al cargar el archivo: ${error.message}`;
            saveButton.disabled = true;
        }
    });

    // Manejar el guardado de cheques
    saveButton.addEventListener('click', async () => {
        if (isProcessing || !chequesData) return;
        
        isProcessing = true;
        saveButton.disabled = true;
        fileStatus.textContent = 'Actualizando cheques...';
        
        try {
            const result = await window.api.updateCheques(chequesData, empresasSelect.value);
            if (result.success) {
                fileStatus.textContent = `Se actualizaron ${result.procesadosOK} cheques exitosamente.`;
                if (result.conError > 0) {
                    fileStatus.textContent += `\n${result.conError} cheques no pudieron ser procesados.`;
                }
            } else {
                fileStatus.textContent = `Error: ${result.error}`;
            }
        } catch (error) {
            console.error('Error al actualizar cheques:', error);
            fileStatus.textContent = `Error: ${error.message}`;
        } finally {
            isProcessing = false;
            saveButton.disabled = !chequesData;
        }
    });
});