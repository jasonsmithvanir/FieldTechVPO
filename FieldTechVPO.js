document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM fully loaded and parsed');

    const airtableApiKey = 'pata9Iv7DANqtJrgO.b308b33cd0f323601f3fb580aac0d333ca1629dd26c5ebe2e2b9f18143ccaa8e';
    const airtableBaseId = 'appQDdkj6ydqUaUkE';
    const airtableTableName = 'tblO72Aw6qplOEAhR';
    const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

    axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

    let allRecords = [];

    async function fetchAllRecords() {
        let records = [];
        let offset = null;

        do {
            const response = await fetch(`${airtableEndpoint}?${new URLSearchParams({ offset })}`, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                }
            });

            const data = await response.json();
            records = records.concat(data.records.map(record => ({
                id: record.id,
                fields: record.fields,
                descriptionOfWork: record.fields['Description of Work'] // Fetch 'Description of Work' field
            })));
            offset = data.offset;
        } while (offset);

        return records;
    }

    async function fetchUncheckedRecords() {
        try {
            showLoadingMessage();
            console.log('Fetching unchecked records from Airtable...');
            const filterByFormula = 'NOT({Field Tech Confirmed Job Complete})';
            let records = [];
            let offset = '';

            do {
                const response = await axios.get(`${airtableEndpoint}?filterByFormula=${encodeURIComponent(filterByFormula)}&offset=${offset}`);
                records = records.concat(response.data.records.map(record => ({
                    id: record.id,
                    fields: record.fields,
                    descriptionOfWork: record.fields['Description of Work'] // Fetch 'Description of Work' field
                })));
                offset = response.data.offset || '';
            } while (offset);

            console.log('Unchecked records fetched successfully:', records);
            allRecords = records;
            displayRecords(records);
        } catch (error) {
            console.error('Error fetching unchecked records:', error);
        } finally {
            hideLoadingMessage();
        }
    }

    function showLoadingMessage() {
        document.getElementById('loadingMessage').innerText = 'Open VPOs are being loaded...';
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('searchButton').classList.add('hidden');
        document.getElementById('submitUpdates').classList.add('hidden');
        document.getElementById('searchBar').classList.add('hidden');
        document.getElementById('searchBarTitle').classList.add('hidden');
    }

    function hideLoadingMessage() {
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('searchButton').classList.remove('hidden');
        document.getElementById('submitUpdates').classList.remove('hidden');
        document.getElementById('searchBar').classList.remove('hidden');
        document.getElementById('searchBarTitle').classList.remove('hidden');
    }

    function displayRecords(records) {
        console.log('Displaying records...');
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = '';

        if (records.length === 0) {
            recordsContainer.innerText = 'No records found.';
            return;
        }

        records = sortRecordsWithSpecialCondition(records);

        const tableHeader = `
            <thead>
                <tr>
                    <th>Vanir Office</th>
                    <th>Job Name</th>
                  <th>Description of Work</th> <!-- New column for Description of Work -->
                   <th>Field Technician</th>
                    <th>Confirmed Complete</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        recordsContainer.innerHTML = tableHeader;
        const tableBody = recordsContainer.querySelector('tbody');

        records.forEach(record => {
            const recordRow = createRecordRow(record);
            tableBody.appendChild(recordRow);
        });

        console.log(`Total number of entries displayed: ${records.length}`);
    }

    function sortRecordsWithSpecialCondition(records) {
        return records.sort((a, b) => {
            const officeA = a.fields['static Vanir Office'] || '';
            const officeB = b.fields['static Vanir Office'] || '';
            const techA = a.fields['static Field Technician'] || '';
            const techB = b.fields['static Field Technician'] || '';

            if (officeA === 'Greensboro' && officeB === 'Greenville, SC') return -1;
            if (officeA === 'Greenville, SC' && officeB === 'Greensboro') return 1;

            const primarySort = officeA.localeCompare(officeB);
            if (primarySort !== 0) return primarySort;

            return techA.localeCompare(techB);
        });
    }

    function createRecordRow(record) {
        const recordRow = document.createElement('tr');
        const vanirOffice = record.fields['static Vanir Office'] || '';
        const jobName = record.fields['Job Name'] || '';
        const fieldTechnician = record.fields['static Field Technician'] || '';
        const fieldTechConfirmedComplete = record.fields['Field Tech Confirmed Job Complete'];
        const checkboxValue = fieldTechConfirmedComplete ? 'checked' : '';
        const descriptionOfWork = record.descriptionOfWork || ''; // Fetched 'Description of Work' field

        recordRow.innerHTML = `
            <td>${vanirOffice}</td>
            <td>${jobName}</td>
            <td>${descriptionOfWork}</td> <!-- Display 'Description of Work' -->
             <td>${fieldTechnician}</td>
            <td>
                <label class="custom-checkbox">
                    <input type="checkbox" ${checkboxValue} data-record-id="${record.id}" data-initial-checked="${checkboxValue}">
                    <span class="checkmark"></span>
                </label>
            </td>
        `;

        recordRow.querySelector('input[type="checkbox"]').addEventListener('change', handleCheckboxChange);

        console.log(`Created row for record ID ${record.id}:`, record);
        return recordRow;
    }

    function handleCheckboxChange(event) {
        const checkbox = event.target;
        const recordId = checkbox.getAttribute('data-record-id');
        const isChecked = checkbox.checked;

        let updates = JSON.parse(localStorage.getItem('updates')) || {};

        if (isChecked) {
            updates[recordId] = true;
        } else {
            delete updates[recordId];
        }

        localStorage.setItem('updates', JSON.stringify(updates));

        console.log(`Checkbox changed for record ID ${recordId}: ${isChecked}`);
        console.log('Current updates:', updates);
    }

    async function submitUpdates() {
        console.log('Submitting updates...');
        let updates = JSON.parse(localStorage.getItem('updates')) || {};
        let updateArray = Object.keys(updates).map(id => ({
            id: id,
            fields: {
                'Field Tech Confirmed Job Complete': updates[id],
                'Field Tech Confirmed Job Completed Date': new Date().toISOString()
            }
        }));

        if (updateArray.length === 0) {
            console.log('No changes to submit.');
            alert('No changes to submit.');
            return;
        }

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        async function patchWithRetry(url, data, retries = 5) {
            let attempt = 0;
            let success = false;
            let response = null;

            while (attempt < retries && !success) {
                try {
                    response = await axios.patch(url, data);
                    success = true;
                } catch (error) {
                    if (error.response && error.response.status === 429) {
                        attempt++;
                        const waitTime = Math.pow(2, attempt) * 1000;
                        console.log(`Rate limit exceeded. Retrying in ${waitTime / 1000} seconds...`);
                        await delay(waitTime);
                    } else {
                        throw error;
                    }
                }
            }

            if (!success) {
                throw new Error('Max retries reached. Failed to patch data.');
            }

            return response;
        }

        try {
            const updatePromises = updateArray.map(update =>
                patchWithRetry(`${airtableEndpoint}/${update.id}`, {
                    fields: update.fields
                })
            );

            showLoadingMessage();
            console.log('Submitting updates to Airtable...', updatePromises);
            await Promise.all(updatePromises);
            console.log('Records updated successfully');
            alert('Records updated successfully.');

            localStorage.removeItem('updates');
            document.getElementById('loadingMessage').innerText = 'Values have been submitted. Repopulating table...';
            await fetchUncheckedRecords();
        } catch (error) {
            console.error('Error updating records:', error);
            alert('Error updating records. Check the console for more details.');
        } finally {
            hideLoadingMessage();
        }
    }

    function filterRecords() {
        const searchTerm = document.getElementById('searchBar').value.toLowerCase();
        const filteredRecords = allRecords.filter(record => {
            const vanirOffice = (record.fields['static Vanir Office'] || '').toLowerCase();
            const jobName = (record.fields['Job Name'] || '').toLowerCase();
            const fieldTechnician = (record.fields['static Field Technician'] || '').toLowerCase();
            return vanirOffice.includes(searchTerm) || jobName.includes(searchTerm) || fieldTechnician.includes(searchTerm);
        });
        displayRecords(filteredRecords);
    }

    function jumpToBottom() {
        console.log('Jumping to bottom...');
        const recordsContainer = document.getElementById('records');
        recordsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    fetchAllRecords()
        .then(records => {
            console.log('Total records fetched:', records.length);
            console.log(records);
        })
        .catch(error => {
            console.error('Error fetching records:', error);
        });

    fetchUncheckedRecords();

    document.getElementById('submitUpdates').addEventListener('click', submitUpdates);
    document.getElementById('searchButton').addEventListener('click', filterRecords);
});