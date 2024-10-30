document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM fully loaded and parsed');

    const storedTech = localStorage.getItem('fieldTech');
    const displayNameElement = document.getElementById('displayName');
    const techDropdown = document.getElementById('techDropdown');
    const searchBar = document.getElementById('searchBar');
    const loadingBarContainer = document.getElementById('loadingBarContainer');
    const loadingBar = document.getElementById('loadingBar');
    const loadingStatus = document.getElementById('loadingPercentage');
    const airtableApiKey = 'pata9Iv7DANqtJrgO.b308b33cd0f323601f3fb580aac0d333ca1629dd26c5ebe2e2b9f18143ccaa8e';
    const airtableBaseId = 'appQDdkj6ydqUaUkE';
    const airtableTableName = 'tblO72Aw6qplOEAhR';
    const airtableEndpoint = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    

    axios.defaults.headers.common['Authorization'] = `Bearer ${airtableApiKey}`;

    // Global variables
    let technicianRecords = [];
    let totalRecords = 0;
    let isLoading = true;
    let currentCheckbox = null;
    let currentRecordId = null;

    // Local storage caching
    const cacheTime = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const lastFetch = localStorage.getItem('lastTechFetchTime');
    const currentTime = new Date().getTime();

    function toggleSearchBarVisibility(records) {
        searchBar.style.display = records.length >= 6 ? 'block' : 'none';
    }

    function updateLoadingBar(current, total) {
        const percentage = Math.min(Math.round((current / total) * 100), 100);
        loadingBar.style.width = `${percentage}%`;
        loadingStatus.innerText = `Loading ${percentage}% (${current} out of ${total})`;
        console.log(`Loading status updated to: ${loadingStatus.innerText}`);
    }
    

    function showLoadingBar() {
        loadingBarContainer.style.display = 'flex'; // Ensure the container is visible
        loadingBar.style.width = '0%'; // Reset width to start at 0
        console.log("Loading bar shown");
    }
function hideLoadingBar() {
    loadingBarContainer.style.display = 'none';
    console.log("Loading bar hidden.");
}

      function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const filterTable = debounce(() => {
        const searchTerm = searchBar.value.toLowerCase();
        const rows = document.querySelectorAll('#records tbody tr');
        rows.forEach(row => {
            const match = Array.from(row.getElementsByTagName('td')).some(cell =>
                cell.textContent.toLowerCase().includes(searchTerm)
            );
            row.style.display = match ? '' : 'none';
        });
    }, 300);
    searchBar.addEventListener('input', filterTable);

 // Call `showLoadingBar` before fetching records and use `updateLoadingBar` as records are fetched
 // Helper function to add delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllRecords() {
    showLoadingBar();
    updateLoadingBar(0, 100); // Initial call to display "0% (0 out of total)"
    technicianRecords = [];
    totalRecords = 0;

    try {
        let offset = '';
        do {
            const response = await axios.get(`${airtableEndpoint}?filterByFormula=AND(NOT({Field Tech Confirmed Job Complete}), {VPO Status} = 'Awaiting Field Tech Complete Confirmation')&offset=${offset}`);
            const pageRecords = response.data.records;
            technicianRecords = technicianRecords.concat(pageRecords);
            totalRecords += pageRecords.length;
            offset = response.data.offset || '';
            
            // Continuously update loading bar and add delay to simulate progress
            updateLoadingBar(technicianRecords.length, totalRecords);
            await delay(200); // 200ms delay for each update, adjust as needed
        } while (offset);
        
        console.log(`Fetched total ${technicianRecords.length} records.`);
    } catch (error) {
        console.error('Error fetching records:', error);
    } finally {
        // Final delay before hiding to allow 100% display time
        await delay(950); // 500ms to keep 100% visible for a moment
        hideLoadingBar();
        isLoading = false;
    }
}

console.log('loadingStatus element:', loadingStatus);
console.log("Loading bar container shown:", loadingBarContainer.style.display);
console.log(`Updating loading status: ${loadingStatus.innerText}`);


    async function populateDropdown() {
        showLoadingBar();
        const cachedTechnicians = JSON.parse(localStorage.getItem('technicians'));
        const techList = cachedTechnicians && currentTime - lastFetch < cacheTime ? cachedTechnicians : await fetchTechniciansWithRecords();
        techDropdown.innerHTML = '<option value="all">Display All</option>' + techList.map(tech => `<option value="${tech}">${tech}</option>`).join('');
        hideLoadingBar();
    }

    async function fetchTechniciansWithRecords() {
        let technicians = new Set();
        let offset = '';
        try {
            do {
                const response = await axios.get(`${airtableEndpoint}?offset=${offset}`);
                response.data.records.forEach(record => {
                    const techName = record.fields['static Field Technician'];
                    if (techName && !record.fields['Field Tech Confirmed Job Complete']) technicians.add(techName);
                });
                offset = response.data.offset || '';
            } while (offset);
        } catch (error) {
            console.error('Error fetching technicians:', error);
        }

        const techArray = Array.from(technicians).sort();
        localStorage.setItem('technicians', JSON.stringify(techArray));
        localStorage.setItem('lastTechFetchTime', currentTime.toString());
        return techArray;
    }

    function displayRecords(records) {
        const recordsContainer = document.getElementById('records');
        recordsContainer.innerHTML = '<thead><tr><th>ID</th><th>Branch</th><th>Job Name</th><th>Description</th><th>Technician</th><th>Complete</th></tr></thead><tbody></tbody>';
        const tbody = recordsContainer.querySelector('tbody');
        records.forEach((record, index) => {
            const row = createRecordRow(record);
            row.style.opacity = 0;
            setTimeout(() => row.style.opacity = 1, index * 100);
            tbody.appendChild(row);
        });
        toggleSearchBarVisibility(records);
    }

    function createRecordRow(record) {
        const recordRow = document.createElement('tr');
        const IDNumber = record.fields['ID Number'] || '';
        const vanirOffice = record.fields['static Vanir Office'] || '';
        const jobName = record.fields['Job Name'] || '';
        const fieldTechnician = record.fields['static Field Technician'] || '';
        const fieldTechConfirmedComplete = record.fields['Field Tech Confirmed Job Complete'];
        const checkboxValue = fieldTechConfirmedComplete ? 'checked' : '';
        const descriptionOfWork = record.fields['Description of Work'] || '';
    
        recordRow.innerHTML = `
            <td>${IDNumber}</td>
            <td>${vanirOffice}</td>
            <td>${jobName}</td>
            <td>${descriptionOfWork}</td>
            <td>${fieldTechnician}</td>
            <td>
                <label class="custom-checkbox">
                    <input type="checkbox" ${checkboxValue} data-record-id="${record.id}" data-initial-checked="${checkboxValue}">
                    <span class="checkmark"></span>
                </label>
            </td>
        `;
    
        const checkbox = recordRow.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('click', handleCheckboxClick);
    
        return recordRow;
    }
    

    async function fetchRecordsForTech(tech) {
        showLoadingBar();
        const records = tech === 'all' ? technicianRecords : technicianRecords.filter(record => record.fields['static Field Technician'] === tech);
        displayRecords(records);
        hideLoadingBar();
    }

    function handleCheckboxClick(event) {
        currentCheckbox = event.target;
        currentRecordId = currentCheckbox.getAttribute('data-record-id');
        const isChecked = currentCheckbox.checked;
        const initialChecked = currentCheckbox.getAttribute('data-initial-checked') === 'true';

        if (!isChecked) {
            submitUpdate(currentRecordId, false);
            modal.style.display = 'none';
        } else if (!initialChecked && isChecked) {
            modal.style.display = 'block';
        }
        currentCheckbox.setAttribute('data-initial-checked', isChecked);
    }

    const modal = document.getElementById('modal');
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');

    yesButton.addEventListener('click', () => {
        submitUpdate(currentRecordId, true);
        modal.style.display = 'none';
    });

    noButton.addEventListener('click', () => {
        if (currentCheckbox) {
            currentCheckbox.checked = false;
        }
        modal.style.display = 'none';
    });

    async function submitUpdate(recordId, isChecked) {
        console.log(`Submitting update for record ID ${recordId}...`);
        try {
            await axios.patch(`${airtableEndpoint}/${recordId}`, {
                fields: {
                    'Field Tech Confirmed Job Complete': isChecked,
                    'Field Tech Confirmed Job Completed Date': isChecked ? new Date().toISOString() : null
                }
            });
            updateCheckboxUI(recordId, isChecked);
            location.reload();
        } catch (error) {
            console.error('Error updating record:', error);
        }
    }

    function updateCheckboxUI(recordId, isChecked) {
        const checkbox = document.querySelector(`input[data-record-id="${recordId}"]`);
        if (checkbox) {
            checkbox.checked = isChecked;
        }
    }

    techDropdown.addEventListener('change', () => {
        if (isLoading) {
            alert("The page is still loading. Please wait until the data is fully loaded.");
            return;
        }
        const selectedTech = techDropdown.value;
        fetchRecordsForTech(selectedTech);
        localStorage.setItem('fieldTech', selectedTech);
        displayNameElement.innerText = `Logged in as: ${selectedTech}`;
    });

    await populateDropdown();
    await fetchAllRecords();
    fetchRecordsForTech(storedTech || 'all');
});
