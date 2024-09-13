document.addEventListener('DOMContentLoaded', () => {
    const empresasSelect = document.getElementById('empresas');
    const empresas = [
        { id: 'empresa1', nombre: 'Empresa 1' },
        { id: 'empresa2', nombre: 'Empresa 2' }
    ];
    
    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nombre;
        empresasSelect.appendChild(option);
    });
});

let chequesData = null;

window.api.onChequesLoaded((cheques) => {
    chequesData = cheques;
    document.getElementById('fileStatus').textContent = 'Archivo de cheques cargado';
});

window.api.onSaveCheques(async () => {
    if (!chequesData) {
        alert('No se ha cargado ningún archivo de cheques.');
        return;
    }

    const empresa = document.getElementById('empresas').value;
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