// Cargar empresas en el select al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Llamamos al método getEmpresas expuesto en preload.js
        const empresas = await window.api.getEmpresas();
        const empresasSelect = document.getElementById('empresas');
        
        // Llenar el select con las empresas obtenidas
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nombre;
            empresasSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar empresas:', error);
        alert('Error al cargar las empresas desde la base de datos');
    }
});

// Leer y validar el archivo Excel al seleccionar un archivo
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir la hoja de Excel a JSON
        const chequesData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validar el contenido del archivo
        if (!validarArchivoExcel(chequesData)) {
            alert('El archivo no es válido');
            return;
        }

        // Enviar los datos al main process cuando se presiona "Guardar"
        document.getElementById('chequeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const idEmpresa = document.getElementById('empresas').value;
            if (!idEmpresa) {
                alert('Debe seleccionar una empresa');
                return;
            }

            try {
                // Llamamos al método updateCheques expuesto en preload.js
                const result = await window.api.updateCheques(chequesData, idEmpresa);
                if (result.success) {
                    alert('Cheques actualizados exitosamente');
                } else {
                    alert('Error al actualizar cheques');
                }
            } catch (error) {
                console.error('Error al actualizar cheques:', error);
                alert('Ocurrió un error al intentar actualizar los cheques.');
            }
        });
    };

    reader.readAsArrayBuffer(file);
});

// Función para validar el archivo Excel
function validarArchivoExcel(data) {
    // Verificar que cada columna tenga 2 filas y que los tipos de datos sean válidos
    for (let i = 0; i < data.length; i++) {
        if (data[i].length !== 2) {
            return false;
        }
        const nroCheque = data[i][0];
        const idEmpresa = data[i][1];
        if (typeof nroCheque !== 'number' || typeof idEmpresa !== 'number') {
            return false;
        }
    }
    return true;
}
