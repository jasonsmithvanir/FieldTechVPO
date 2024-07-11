document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM fully loaded and parsed');

    const airtableApiKey = 'pata9Iv7DANqtJrgO.b308b33cd0f323601f3fb580aac0d333ca1629dd26c5ebe2e2b9f18143ccaa8e';
    const airtableBaseId = 'appQDdkj6ydqUaUkE';
    const airtableTableName = 'tblO72Aw6qplOEAhR';
    const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

    axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

    let allRecords = [];

    // Clear updates on page load
    localStorage.removeItem('updates');

    function toggleLoading(show) {
        const loadingMessage = document.getElementById('loadingMessage');
        const hideableElements = document.querySelectorAll('.hideable');
        if (show) {
            console.log('Showing loading message and hiding other elements.');
            loadingMessage.style.display = 'block';
            hideableElements.forEach(el => el.classList.add('hidden'));
        } else {
            console.log('Hiding loading message and showing other elements.');
            loadingMessage.style.display = 'none';
            hideableElements.forEach(el => el.classList.remove('hidden'));
        }
    }

    async function fetchAllRecords() {
        console.log('Fetching all records...');
        let records = [];
        let offset = null;

        do {
            const response = await fetch(`${airtableEndpoint}?${new URLSearchParams({ offset })}`, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                }
            });

            const data = await response.json();
            records = records.concat(data.records);
            offset = data.offset;
        } while (offset);

        console.log('All records fetched:', records);
        return records;
    }

    async function fetchUncheckedRecords() {
        try {
            console.log('Fetching unchecked records from Airtable...');
            toggleLoading(true);
            const filterByFormula = 'NOT({Field Tech Confirmed Job Complete})';
            let records = [];
            let offset = '';

            do {
                const response = await axios.get(`${airtableEndpoint}?filterByFormula=${encodeURIComponent(filterByFormula)}&offset=${offset}`);
                records = records.concat(response.data.records);
                offset = response.data.offset || '';
            } while (offset);

            console.log('Unchecked records fetched successfully:', records);
            allRecords = records;
            displayRecords(records);
        } catch (error) {
            console.error('Error fetching unchecked records:', error);
        } finally {
            toggleLoading(false);
        }
    }

    function displayRecords(records) {
        console.log('Displaying records...');
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = ''; // Clear previous content

        if (records.length === 0) {
            recordsContainer.innerText = 'No records found.';
            console.log('No records found.');
            return;
        }

        records.sort((a, b) => {
            const officeA = (a.fields['static Vanir Office'] || '').replace(/"/g, '');
            const officeB = (b.fields['static Vanir Office'] || '').replace(/"/g, '');
            
            // Special case handling for "Greenville,SC"
            if (officeA === 'Greenville,SC' && officeB === 'Greensboro') return 1;
            if (officeB === 'Greenville,SC' && officeA === 'Greensboro') return -1;

            const officeComparison = officeA.localeCompare(officeB);
            if (officeComparison !== 0) return officeComparison;

            // Secondary sort by Field Technician
            const fieldTechA = (a.fields['static Field Technician'] || '').replace(/"/g, '');
            const fieldTechB = (b.fields['static Field Technician'] || '').replace(/"/g, '');
            return fieldTechA.localeCompare(fieldTechB);
        });

        const tableHeader = `
            <thead>
                <tr>
                    <th>Vanir Office</th>
                    <th>Job Name</th>
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
        console.log('Records displayed successfully.');
    }

    function createRecordRow(record) {
        const recordRow = document.createElement('tr');
        const vanirOffice = (record.fields['static Vanir Office'] || '').replace(/"/g, '');
        const jobName = (record.fields['Job Name'] || '').replace(/"/g, '');
        const fieldTechnician = (record.fields['static Field Technician'] || '').replace(/"/g, '');
        const fieldTechConfirmedComplete = record.fields['Field Tech Confirmed Job Complete'];
        const checkboxValue = fieldTechConfirmedComplete ? 'checked' : '';

        recordRow.innerHTML = `
            <td>${vanirOffice}</td>   
            <td>${jobName}</td>
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
            if (Object.keys(updates).length >= 4) {
                alert('You can only select up to 4 checkmarks at a time before submitting.');
                checkbox.checked = false;
                return;
            }
            updates[recordId] = true;
        } else {
            delete updates[recordId];
            if (Object.keys(updates).length === 0) {
                localStorage.removeItem('updates');
            }
        }

        localStorage.setItem('updates', JSON.stringify(updates));

        console.log(`Checkbox changed for record ID ${recordId}: ${isChecked}`);
        console.log('Current updates:', updates);
    }

    async function submitUpdates() {
        console.log('Submit button clicked.');
        document.getElementById('loadingMessage').innerText = 'Submitting updates, please wait...';
        document.getElementById('loadingMessage').style.display = 'block';
        let updates = JSON.parse(localStorage.getItem('updates')) || {};
        let updateArray = Object.keys(updates).map(id => ({
            id: id,
            fields: {
                'Field Tech Confirmed Job Complete': updates[id]
            }
        }));

        if (updateArray.length === 0) {
            console.log('No changes to submit.');
            alert('No changes to submit.');
            document.getElementById('loadingMessage').style.display = 'none';
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

            console.log('Submitting updates to Airtable...', updatePromises);
            await Promise.all(updatePromises);
            console.log('Records updated successfully');
            alert('Records updated successfully.');

            localStorage.removeItem('updates');
            window.location.reload();
        } catch (error) {
            console.error('Error updating records:', error);
            alert('Error updating records. Check the console for more details.');
        } finally {
            document.getElementById('loadingMessage').style.display = 'none';
        }
    }

    function filterRecords() {
        const selectedLocation = document.getElementById('locationDropdown').value;
        console.log('Filtering records with selected location:', selectedLocation);
        if (selectedLocation === '') {
            // Show all records if no location is selected
            displayRecords(allRecords);
        } else {
            const filteredRecords = allRecords.filter(record => {
                const vanirOffice = (record.fields['static Vanir Office'] || '').replace(/"/g, '');
                return vanirOffice === selectedLocation;
            });
            console.log('Filtered records:', filteredRecords);
            displayRecords(filteredRecords);
        }
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
    document.getElementById('jumpToBottom').addEventListener('click', jumpToBottom);
    document.getElementById('locationDropdown').addEventListener('change', function() {
        console.log('Location dropdown changed.');
        filterRecords();
    });
});
