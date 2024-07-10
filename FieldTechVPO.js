document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM fully loaded and parsed');

    // Define Airtable API credentials and endpoint
    const airtableApiKey = 'pata9Iv7DANqtJrgO.b308b33cd0f323601f3fb580aac0d333ca1629dd26c5ebe2e2b9f18143ccaa8e';
    const airtableBaseId = 'appQDdkj6ydqUaUkE';
    const airtableTableName = 'tblO72Aw6qplOEAhR';
    const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

    // Set default Axios headers for authorization
    axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

    // Function to fetch records from Airtable
    async function fetchRecords() {
        try {
            const response = await axios.get(airtableEndpoint);
            const records = response.data.records;
            console.log('Records fetched successfully:', records);
            displayRecords(records);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    }

    // Function to display records in a table on the webpage
    function displayRecords(records) {
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = ''; // Clear previous content

        records.forEach(record => {
            const recordRow = createRecordRow(record);
            recordsContainer.appendChild(recordRow);
        });
    }

    // Function to create a table row for a record
    function createRecordRow(record) {
        const recordRow = document.createElement('tr');
        const jobName = record.fields['Job Name'] || '';
        const fieldTechnician = record.fields['static Field Technician'] || '';
        const subcontractor = record.fields['static Subcontractor'] || '';
        const vanirOffice = record.fields['static Vanir Office'] || '';
        const fieldTechConfirmedComplete = record.fields['Field Tech Confirmed Job Complete'];
        const checkboxValue = fieldTechConfirmedComplete ? 'checked' : '';

        recordRow.innerHTML = `
            <td>${jobName}</td>
            <td>${fieldTechnician}</td>
            <td>${subcontractor}</td>
            <td>${vanirOffice}</td>
            <td><input type="checkbox" ${checkboxValue} onclick="updateCheckbox('${record.id}', this.checked)"></td>
        `;
        
        return recordRow;
    }

    // Function to update a record in Airtable based on checkbox status
    async function updateCheckbox(recordId, isChecked) {
        try {
            await axios.patch(`${airtableEndpoint}/${recordId}`, {
                fields: {
                    'Field Tech Confirmed Job Complete': isChecked
                }
            });
            console.log(`Record ${recordId} updated successfully`);
        } catch (error) {
            console.error(`Error updating record ${recordId}:`, error);
        }
    }

    // Fetch records when the document is fully loaded
    fetchRecords();
});
