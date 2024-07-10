const airtableApiKey = 'pat329MU6ltjcpC6w.93c1907bd3e2d8c94fe4b51ccedb3344065167552abc51bd6f606e17bece4e61';
const airtableBaseId = 'appQDdkj6ydqUaUkE';
const airtableTableName = 'tblO72Aw6qplOEAhR';
const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;

axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

async function fetchRecords() {
    try {
        const response = await axios.get(airtableEndpoint);
        const records = response.data.records;
        displayRecords(records);
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}

function displayRecords(records) {
    const recordsContainer = document.getElementById('records');
    recordsContainer.innerHTML = '';

    records.forEach(record => {
        const recordRow = document.createElement('tr');
        const recordId = record.id;
        const fieldA = record.fields['Job Name'];
        const fieldB = record.fields['Field Tech Confirmed Complete'];
        const checkboxValue = record.fields['Field Tech Confirmed Complete'];

        recordRow.innerHTML = `
            <td><input type="text" value="${fieldA}" onchange="updateJobName('${recordId}', this.value)"></td>
            <td><input type="checkbox" ${checkboxValue ? 'checked' : ''} onclick="updateCheckbox('${recordId}', this.checked)"></td>
            <td><button onclick="deleteRecord('${recordId}')">Delete</button></td>
        `;
        recordsContainer.appendChild(recordRow);
    });
}

async function updateJobName(recordId, newJobName) {
    try {
        await axios.patch(`${airtableEndpoint}/${recordId}`, {
            fields: {
                'Job Name': newJobName
            }
        });
        console.log('Job Name updated successfully');
    } catch (error) {
        console.error('Error updating Job Name:', error);
    }
}

async function updateCheckbox(recordId, isChecked) {
    try {
        await axios.patch(`${airtableEndpoint}/${recordId}`, {
            fields: {
                'Field Tech Confirmed Complete': isChecked
            }
        });
        console.log('Record updated successfully');
    } catch (error) {
        console.error('Error updating record:', error);
    }
}

function addNewRecordRow() {
    const recordsContainer = document.getElementById('records');
    const newRecordRow = document.createElement('tr');

    newRecordRow.innerHTML = `
        <td><input type="text" placeholder="Enter job name"></td>
        <td><input type="checkbox"></td>
        <td><button onclick="saveNewRecord(this)">Save</button></td>
    `;
    recordsContainer.appendChild(newRecordRow);
}

async function saveNewRecord(button) {
    const newRow = button.parentNode.parentNode;
    const jobNameInput = newRow.querySelector('input[type="text"]');
    const checkboxInput = newRow.querySelector('input[type="checkbox"]');

    const jobName = jobNameInput.value;
    const checkboxValue = checkboxInput.checked;

    try {
        const response = await axios.post(airtableEndpoint, {
            fields: {
                'Job Name': jobName,
                'Field Tech Confirmed Complete': checkboxValue
            }
        });
        const newRecord = response.data;
        fetchRecords();
        console.log('New record added successfully');
    } catch (error) {
        console.error('Error adding new record:', error);
    }
}

async function deleteRecord(recordId) {
    try {
        await axios.delete(`${airtableEndpoint}/${recordId}`);
        fetchRecords();
        console.log('Record deleted successfully');
    } catch (error) {
        console.error('Error deleting record:', error);
    }
}

fetchRecords();
