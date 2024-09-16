document.addEventListener('DOMContentLoaded', async () => {
    const empresasSelect = document.getElementById('empresas');
    const fileInput = document.getElementById('fileInput');
    const saveButton = document.getElementById('saveButton');
    const fileStatus = document.getElementById('fileStatus');

    let chequesData = null;

    // Cargar empresas
    const empresas = await window.api.getEmpresas();
    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nombre;
        empresasSelect.appendChild(option);
    });

    fileInput.addEventListener('change', async () => {
        chequesData = await window.api.loadCheques();
        if (chequesData) {
            fileStatus.textContent = 'Archivo de cheques cargado';
        } else {
            fileStatus.textContent = 'No se ha cargado ningún archivo de cheques';
        }
    });

    saveButton.addEventListener('click', async () => {
        if (!chequesData) {
            alert('No se ha cargado ningún archivo de cheques.');
            return;
        }

        const empresa = empresasSelect.value;
        if (!empresa) {
            alert('Debe seleccionar una empresa');
            return;
        }

        try {
            const result = await window.api.updateCheques(chequesData, empresa);
            if (result.success) {
                alert('Cheques actualizados exitosamente');
            } else {
                alert('Error al actualizar cheques');
            }
        } catch (error) {
            console.error('Error al actualizar cheques:', error);
            alert('Error al actualizar cheques. Por favor, intente nuevamente.');
        }
    });
});