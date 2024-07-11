# FieldTech VPO

FieldTech VPO is a web application designed to manage and track field technician jobs, allowing users to view job details, confirm job completion, and submit updates. The application integrates with Airtable for data storage and retrieval.

## Features

- Display job records with details such as Vanir Office, Job Name, Field Technician, and Confirmation status.
- Allow users to confirm job completion using checkboxes.
- Fetch and display records with unchecked completion status from Airtable.
- Submit updates to Airtable and refresh the page to reflect changes.
- Sticky table headers and submit button for better usability.

## Technologies Used

- HTML
- CSS
- JavaScript
- Airtable API
- Axios

## Setup and Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/FieldTechVPO.git
    ```

2. **Navigate to the project directory:**
    ```bash
    cd FieldTechVPO
    ```

3. **Open the project in your preferred code editor.**

4. **Install dependencies:**
    Ensure you have [Axios](https://axios-http.com/docs/intro) installed if you are using a build tool or package manager like npm:
    ```bash
    npm install axios
    ```

## TO edit

1. **Update Airtable API credentials: to use with another database** 
    - Open `FieldTechVPO.js` and update the following variables with your Airtable API credentials:
    ```javascript
    const airtableApiKey = 'your_airtable_api_key';
    const airtableBaseId = 'your_base_id';
    const airtableTableName = 'your_table_name';
    ```

2. **Open `index.html` in a web browser:**
    You can simply double-click `index.html` to open it in your default web browser, or use a local server for development purposes.

## File Structure


## Functions in `FieldTechVPO.js`

- **fetchAllRecords()**: Fetches all records from Airtable, handling pagination.
- **fetchUncheckedRecords()**: Fetches records from Airtable with unchecked completion status.
- **displayRecords(records)**: Displays the fetched records in a table format on the webpage.
- **createRecordRow(record)**: Creates a table row for each record.
- **submitUpdates()**: Submits updates to Airtable based on checkbox statuses.
- **jumpToBottom()**: Scrolls to the bottom of the table.

## CSS Styling

- The table headers (`th`) are sticky at the top.
- The submit button is sticky at the bottom.
- Table columns adjust their width based on the content.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Thanks to Airtable for their powerful API.
- Axios for simplifying HTTP requests.

## Contact

If you have any questions or feedback, please contact us at [your-email@example.com].

