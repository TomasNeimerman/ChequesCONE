document.addEventListener('DOMContentLoaded', async () => {
    try {
        const empresas = await window.api.getEmpresas();
        const empresasSelect = document.getElementById('empresas');
        
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nombre;
            empresasSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar empresas:', error);
        alert('Error al cargar las empresas. Por favor, intente nuevamente.');
    }
});

document.getElementById('chequeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const idEmpresa = document.getElementById('empresas').value;
    const fileInput = document.getElementById('fileInput');

    if (!idEmpresa) {
        alert('Debe seleccionar una empresa');
        return;
    }

    if (!fileInput.files[0]) {
        alert('Debe seleccionar un archivo');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const chequesData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        try {
            const result = await window.api.updateCheques(chequesData, idEmpresa);
            if (result.success) {
                alert('Cheques actualizados exitosamente');
            } else {
                alert('Error al actualizar cheques');
            }
        } catch (error) {
            console.error('Error al actualizar cheques:', error);
            alert('Error al actualizar cheques. Por favor, intente nuevamente.');
        }
    };

    reader.readAsArrayBuffer(fileInput.files[0]);
});