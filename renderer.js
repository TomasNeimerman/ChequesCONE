document.addEventListener('DOMContentLoaded', () => {
    const empresasSelect = document.getElementById('empresas');
    const empresas = [
        { id: 'SBDATIER', nombre: 'TIERRAS DEL SUR' },
        { id: 'SBDAPATA', nombre: 'PATAGONIA' },
        { id: 'SBDASURD', nombre: 'BARLOG' },
        { id: 'SBDABARS', nombre: 'BARSAT' },
        { id: 'SBDANORE', nombre: 'NORIA EXPRESS' },
        { id: 'SBDABALO', nombre: 'BARRACAS LOGISTICA' },
        { id: 'SBDATENL', nombre: 'TENLOG ' }
    ];
    
    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nombre;
        empresasSelect.appendChild(option);
    });
});

let chequesData = null;

// Cuando se carga el archivo de cheques
window.api.onChequesLoaded((cheques) => {
    chequesData = cheques;
    document.getElementById('fileStatus').textContent = 'Archivo de cheques cargado';
});

document.getElementById('saveButton').addEventListener('click', async () => {
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
        // Enviar datos al backend
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
