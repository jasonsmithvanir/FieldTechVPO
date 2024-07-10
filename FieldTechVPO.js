document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM fully loaded and parsed');

    // Define Airtable API credentials and endpoint
    const airtableApiKey = 'pata9Iv7DANqtJrgO.b308b33cd0f323601f3fb580aac0d333ca1629dd26c5ebe2e2b9f18143ccaa8e';
    const airtableBaseId = 'appQDdkj6ydqUaUkE';
    const airtableTableName = 'tblO72Aw6qplOEAhR';
    const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

    // Set default Axios headers for authorization
    axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

    // Function to fetch records from Airtable with unchecked checkboxes
    async function fetchUncheckedRecords() {
        try {
            console.log('Fetching unchecked records from Airtable...');
            const filterByFormula = 'NOT({Field Tech Confirmed Job Complete})';
            const response = await axios.get(`${airtableEndpoint}?filterByFormula=${encodeURIComponent(filterByFormula)}`);
            const records = response.data.records;
            console.log('Unchecked records fetched successfully:', records);
            displayRecords(records);
        } catch (error) {
            console.error('Error fetching unchecked records:', error);
        }
    }

    // Function to display records in a table on the webpage
    function displayRecords(records) {
        console.log('Displaying records...');
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = ''; // Clear previous content

        records.forEach(record => {
            const recordRow = createRecordRow(record);
            recordsContainer.appendChild(recordRow);
        });
        console.log('Records displayed successfully.');
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
            <td>
                <label class="custom-checkbox">
                    <input type="checkbox" ${checkboxValue} data-record-id="${record.id}">
                    <span class="checkmark"></span>
                </label>
            </td>
        `;

        console.log(`Created row for record ID ${record.id}:`, record);
        return recordRow;
    }

    // Function to update records in Airtable based on checkbox statuses
    async function submitUpdates() {
        console.log('Submitting updates...');
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const updates = [];

        checkboxes.forEach(checkbox => {
            const recordId = checkbox.getAttribute('data-record-id');
            const isChecked = checkbox.checked;

            updates.push({
                id: recordId,
                fields: {
                    'Field Tech Confirmed Job Complete': isChecked
                }
            });

            console.log(`Prepared update for record ID ${recordId}: ${isChecked}`);
        });

        try {
            const updatePromises = updates.map(update => 
                axios.patch(`${airtableEndpoint}/${update.id}`, {
                    fields: update.fields
                })
            );

            await Promise.all(updatePromises);
            console.log('Records updated successfully');
        } catch (error) {
            console.error('Error updating records:', error);
        }
    }

    // Function to scroll to the bottom of the table
    function jumpToBottom() {
        console.log('Jumping to bottom...');
        const recordsContainer = document.getElementById('records');
        recordsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // Fetch records with unchecked checkboxes when the document is fully loaded
    fetchUncheckedRecords();

    // Attach event listeners
    document.getElementById('submitUpdates').addEventListener('click', submitUpdates);
    document.getElementById('jumpToBottom').addEventListener('click', jumpToBottom);
});
