//************************************
// ArtistDatabase
// Copyright 2025 Michael Steuber
//====================================
// 
// Artist databse website interface functions
// 
// A collection of functions to provide web functionality to the Python Flask server.
// Submits HTTP requests to the Flask server and sanitizes inputs before they are saved
// or displayed. 
//************************************


// The IP and port of the Flask server to connect to
const flaskServer = "http://127.0.0.1:5000";


/**
 * @event lockTable
 */
const lockTable = new CustomEvent("lockTable");
document.addEventListener("lockTable", lockDownTable);

/**
 * @event reopenTable
 */
const reopenTable = new CustomEvent("reopenLockedTable");
document.addEventListener("reopenLockedTable", reopenLockedTable);

// Listens for page reload events and triggers the loadStart function when one occurs
window.addEventListener("load", loadStart); 

/*
* Summary: Deactivates all interactive elements on the page.
*
* Description: Iterates through all page elements and removes any event listeners/onclick events to prevent multiple edits from happening at the same time.
*/
function lockDownTable(){
    if(document.getElementById('swapButton')){
        document.getElementById('swapButton').remove();
    }
    var toListenNodes = document.getElementById("toListen");
    for(var i = 1; i < toListenNodes.rows.length; i++){
        toListenNodes.rows[i].removeEventListener("mouseover", createSwapButton);
        for(let cell = 0; cell < toListenNodes.rows[i].cells.length; cell++){
            toListenNodes.rows[i].cells[cell].onclick = "";
        }
    }
    var listenedNodes = document.getElementById("listened");
    for(var j = 1; j < listenedNodes.rows.length; j++){
        for(let cell = 0; cell < listenedNodes.rows[j].cells.length; cell++){
            listenedNodes.rows[j].cells[cell].onclick = ""; 
        }
    }
    document.getElementById('addEntrytoListen').disabled = true;
    document.getElementById('removeEntrytoListen').disabled = true;
    document.getElementById('addEntrylistened').disabled = true; 
    document.getElementById('removeEntrylistened').disabled = true;
}

/*
* Summary: Reactivates all interactive elements on the page.
*
* Description: Iterates through the entire page and activates and deactivated listeners/onclick events following a form submision.
*/
function reopenLockedTable(){
    var toListenNodes = document.getElementById("toListen");
    for(var i = 1; i < toListenNodes.rows.length; i++){
        toListenNodes.rows[i].addEventListener("mouseover", createSwapButton);
        let cells = toListenNodes.rows[i].cells;
        for(let cell = 0; cell < cells.length; cell++){
            if(cells[cell].id != 'date'){
                cells[cell].onclick = editEntry;
            }
        }
    }
    var listenedNodes = document.getElementById("listened");
    for(var i = 1; i < listenedNodes.rows.length; i++){
        listenedNodes.rows[i].addEventListener("mouseover", createSwapButton);
        let cells = listenedNodes.rows[i].cells;
        for(let cell = 0; cell < cells.length; cell++){
            if(cells[cell].id != 'date'){
                cells[cell].onclick = editEntry;
            }
        }
    }
    document.getElementById('addEntrytoListen').disabled = false;
    document.getElementById('removeEntrytoListen').disabled = false;
    document.getElementById('addEntrylistened').disabled = false;
    document.getElementById('removeEntrylistened').disabled = false;
}

/** 
* Summary: Intializes JS elements on page load
*  
* Description: Assigns functions and passes parameters to table buttons, then fetches 
*              JSON of table elements from getTable() and passes
*              it to createTable after the getTable fetch is complete.
*
* @listens window.load
*/
async function loadStart(){
    document.getElementById('addEntrytoListen').onclick = function () { addEntry('toListen') }; //TODO: look at this again, consider rewriting this function perhaps
    document.getElementById('removeEntrytoListen').onclick = function () { startRemove('toListen') };
    document.getElementById('addEntrylistened').onclick = function () { addEntry('listened') };
    document.getElementById('removeEntrylistened').onclick = function () { startRemove('listened') };

    var json_data;
    await getTable().then(data => json_data = data);
    for (var table in json_data) { 
        (createTable(table, json_data)); 
    }
}

/**
* Summary: Fetches the elements of the SQL database as JSON.
*
* Description: Submits a GET request to the python flask server at route /getTable and 
*              stores the contents of the data field in json_data.
* 
* @return {Promise<JSON>} JSON of SQL database contents
*/
async function getTable(){
    var json_data
    await fetch(flaskServer + '/getTable')
    .then( response => response.json() )
    .then( data =>  json_data = data['data'] )
    .catch((error) => console.error(error))
    return Promise.resolve(json_data);
}

/**
* Summary: Clears and repopulates the specified table with the give JSON data
*
* Description: Creates and populates a new row in the toListenTable element. Each row's ID corresponds to the 
*              index value from the SQL database. The name and note cells all have the same ID (name and notes 
*              respectively) and call the editEntry function on click as well as the createSwapButton function 
*              on mouse over. The date cell is only displayed. 
* 
* @param {string} table Table to create, either toListen or Listened
*
* @param {JSON} new_json The JSON recieved from the SQL database
*/
function createTable(table, new_json){
    // Clear the table row by row, skipping the header
    var tableRef = document.getElementById(table);
    for(var i = 1; i < tableRef.rows.length; i++){
        tableRef.row[i].remove();
    }
    // Iterate over json data
    for(var artist in new_json[table]){
        var newRow = document.getElementById(table).insertRow();
        newRow.id =  `${new_json[table][artist]['ind']}`;

        if(table == "toListen"){ // Only assign mouseover event to rows in 'toListen'
            newRow.addEventListener("mouseover", createSwapButton);
        }
        // Insert cells one by one
        var name = newRow.insertCell(0);
        var notes = newRow.insertCell(1);
        var date = newRow.insertCell(2);

        name.innerHTML = new_json[table][artist]['name'];
        name.onclick = editEntry;
        name.id = 'name';
        notes.innerHTML = new_json[table][artist]['notes'];
        notes.onclick = editEntry;
        notes.id = 'notes';
        date.innerHTML = new_json[table][artist]['date'];
        date.id = 'date';
    }
}

/**
* Summary: Creates button to transfer toListen table data to listened table
*
* Description: On mouseover of a toListen table row, remove any previous swap button and 
*              replace it with a new one at the calling row
*
* @listens tr.mouseover
*/
function createSwapButton(){
    // If a swap button exists anywhere on the page, get rid of it
    if(document.getElementById('swapButton')){
        document.getElementById('swapButton').remove();
    }

    let swap = document.createElement('button');

    // Assign style elements
    swap.innerHTML = "<b>---></b>"
    let rect = this.getBoundingClientRect(); // For position info
    swap.style.width = "50px";
    swap.style.height = "20px";
    swap.style.position = "absolute";
    swap.style.top = (rect.top + ((rect.height / 2) - 9.5)) + "px"; // 9.5 is my best guess
    swap.style.left = (rect.width + 40) + "px";
    swap.classList.add("swap-button");
    swap.id = 'swapButton';

    this.parentElement.parentElement.parentElement.appendChild(swap); // Append to calling table's parent div

    // Create elements for JSON message
    var index = this.id;
    var toDelete = [index];
    var name = this.cells[0].innerHTML;
    var notes = this.cells[1].innerHTML;
    swap.onclick = async function(){

        await fetch(flaskServer + '/addEntry', { // Send a request to add the entry to the listened table
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                table: 'listened',
                name: name,
                note: notes
            })
        });
        
        await fetch(flaskServer + '/deleteEntries', { // And afterwards delete it from the toListen table
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                table: 'toListen',
                delete: toDelete
            })
    });
    // Repopulate table
    let newTable = [];
    getTable().then((newTab) => newTable = newTab);
    createTable('listened', newTable);
    createTable('toListen', newTable);

}
}

/**
* Summary: Add an entry to a given table.
*
* Description: Creates a new row at the end of the specified table with text inputs to submit data for a new entry.
*
* @param {string} entryTable the calling table, either toListen or listened
*
* @listens button.onclick addEntry
* @fires document.lockTable 
*/
function addEntry(entryTable){
    // Trigger lockTable event to prevent other edits
    document.dispatchEvent(lockTable);

    var tableRef = document.getElementById(entryTable);
    var newRow = tableRef.insertRow();
    var newNameCell = newRow.insertCell(0);
    var newNoteCell = newRow.insertCell(1);

    // Create name column input
    var newNameIn = document.createElement('input');
    newNameIn.type = 'text';
    newNameIn.id = 'newName';
    newNameIn.addEventListener('input', () => validateEntry('addEntry' + entryTable)); // Disable the submit button if no input is given
    newNameCell.appendChild(newNameIn);
    validateEntry('addEntry' + entryTable); // Disable submit immediately after creation, wait for input eventListener to be triggered

    // Create note column inputs
    var newNoteIn = document.createElement('input');
    newNoteIn.type = 'text';
    newNoteIn.id = 'newNote';
    newNoteIn.addEventListener('input', () => validateEntry('addEntry' + entryTable)); // Disable submit if no input is given
    newNoteCell.appendChild(newNoteIn);
    validateEntry('addEntry' + entryTable);

    // Create cancel button
    var cancelButton = document.createElement('button');
    cancelButton.innerHTML = "Cancel";
    cancelButton.id = 'cancel';

    // Reenable addEntry button (see lockTable event), rename it to Submit, and change its onclick (see submitEntry)
    document.getElementById('addEntry' + entryTable).disabled = false;  
    document.getElementById('addEntry' + entryTable).textContent = "Submit";
    document.getElementById('addEntry' + entryTable).onclick = function () { submitEntry(entryTable) };

    // Assign cancel button functionality
    cancelButton.onclick = function () { submitCancelEnter(entryTable, newRow) };
    document.getElementById('addEntry' + entryTable).parentElement.appendChild(cancelButton);
}

/**
* Summary: Cancel table entry 
*
* Description: Revert table back to its original state after activating the addEntry button
*
* @param {string} entryTable calling table, either toListen or listened
* @param {HTMLTableRowElement} row reference to the row generated by addEntry function
*
* @fires document.reopenTable
*/
function submitCancelEnter(entryTable, row){
    // Remove cells and row reference
    document.getElementById('newName').remove();
    document.getElementById('newNote').remove();
    row.remove();
    
    // Revert submit button back to addEntry
    document.getElementById('addEntry' + entryTable).textContent = "Add Entry";
    document.getElementById('addEntry' + entryTable).onclick = function () { addEntry(entryTable) };

    // Reopen the table
    document.dispatchEvent(reopenTable);
    document.getElementById('cancel').remove();

}

/**
* Summary: Submit new entry to SQL database
*
* Description: Sanitizes input and then submits data in new row's cells to the flask server
*              Afterwards, checks for the response for duplicate data and reverts submit button back to addEntry
*
* @param {string} table calling table 
*
* @fires document.reopenTable
*/
async function submitEntry(table){ 
    // Sanitize input (for HTML elements)
    var name = htmlSanitize(document.getElementById('newName').value);
    var note = htmlSanitize(document.getElementById('newNote').value);

    // Submit to flask server
    fetch(flaskServer + '/addEntry', {      // Note for future Michael: the VS Live server plugin forces a page reload on each fetch call. 
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            table: table,
            name: name,
            note: note
        })
        // If the SQL database detects a duplicate name, it will not add the data to the database; rather, it will respond with error code 400 and a message
}).then(response => response.json())
  .then(json_data => { if(json_data['response'] == '400'){ handleDuplicate(json_data, table) }});

    // Recreate table
    newTable = [];
    getTable().then((newTab) => newTable = newTab); 
    createTable(table, newTable);

    // Revert submit button back to addEntry and reopen the table
    document.getElementById('addEntry' + table).textContent = "Add Entry";
    document.getElementById('addEntry' + table).onclick = function () { addEntry(table) }; 
    document.getElementById('cancel').remove();
    document.dispatchEvent(reopenTable);
}

/**
* Summary: Determines what to do with a duplicate database entry.
*
* Description: When a duplicate database entry is detected, the flask server will submit a 400 error triggering this function. 
*              The response will also include a message that is displayed in a confirmation box asking if you'd like to append 
*              the new note to the old name. If yes is selected, a POST request with the original row's name/index and the combination
*              of the two notes will be sent back to the server.
*
* @param {JSON} input the JSON message recieved from the flask server
* @param {string} entryTable the calling table
*/
function handleDuplicate(input, entryTable){
    // prompt for confirmation regarding the deletion of the new note
    if(confirm(input['message'] + " Append new note to old entry?")){
        fetch(flaskServer + '/editTable', {    // If yes, send the new entry info back to the flask server
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                table: entryTable,
                Original: input['data']['old'][entryTable]['ind'][0],
                Column: 'notes',
                Edit: input['data']['old'][entryTable]['notes'][0] + '\n' + input['data']['new'][entryTable]['notes'] // Append new note
                
            })
    });
}
}

/**
* Summary: Ensure input field is not empty
*
* Description: If input field for the given button is empty, deactivate the submit button until input is given.
*
* @param {HTMLButtonElement} button submit button to enable/disable 
*/
function validateEntry(button){
    if(document.getElementById('newName').value == "" || document.getElementById('newNote').value == ""){
        document.getElementById(button).disabled = true;
    }
    else{
        document.getElementById(button).disabled = false;
    }
}

/**
* Summary: Ensure no HTML sensitive elements are present in input
*
* Description: replace input characters in the htmlMap with their unicode equivalents
*
* @param {string} input string to clean
*
* @returns {string} cleaned input
*/
function htmlSanitize(input){
    var htmlMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    var regEsc = /[&<>"'/]/ig;
    return input.replace(regEsc, (match)=>(htmlMap[match]));
}

/**
* Summary: Remove entries from the SQL database
*
* Description: Creates a series of radio buttons next to the rows of the specified table
*
* @param {string} entryTable the table to delete from
*/
function startRemove(entryTable){ 
    document.dispatchEvent(lockTable);
    let table = document.getElementById(entryTable);
    let rows = table.getElementsByTagName('tr');
    let buttonContainer = document.getElementById('buttonContainer' + entryTable);
    const delButtons = []
    for (let i = 1; i < rows.length; i++) {
        let row = rows[i];
        let rect = row.getBoundingClientRect();

        newButton = document.createElement("INPUT");
        newButton.setAttribute("type", "radio");
        newButton.id = i;
        newButton.classList.add("delete-button"); 

        newButton.style.position = "absolute";
        newButton.style.top = (rect.top + ((rect.height / 2) - 7)) + "px";
        let widthVal = (entryTable == 'listened' ? 210 : 35);
        newButton.style.left = (rect.width + widthVal) + "px";

        newButton.onclick = function () {
            this.checked = !this.tag;
            row.classList.toggle("strikethrough");
            this.tag = this.checked;
        }
        buttonContainer.appendChild(newButton);
}
    var cancelButton = document.createElement('button');
    cancelButton.innerHTML = "Cancel";
    cancelButton.id = 'cancel';
   
    document.getElementById('removeEntry' + entryTable).disabled = false;
    document.getElementById('removeEntry' + entryTable).textContent = "Submit Remove";
    document.getElementById('removeEntry' + entryTable).onclick = function () { submitRemove(entryTable) };

    cancelButton.addEventListener('click', () => submitCancelRemove(entryTable));
    document.getElementById('removeEntry' + entryTable).parentElement.appendChild(cancelButton);
}

/*
* Summary: 
*
* Description: 
*/
function submitCancelRemove(entryTable){
    document.getElementById('buttonContainer' + entryTable).innerHTML = "";  // For future Michael: weird cancel button issues are likely due to you forgetting that something's local
                                                                             // so the submitCancel function dies before it does anything. OR ITS CAUSE YOURE STUPID AND DONT KNOW HOW TO HANDLE EVENT LISTENERS

    document.getElementById('removeEntry' + entryTable).textContent = "Remove Entry";
    document.getElementById('removeEntry' + entryTable).onclick = function () { startRemove(entryTable) };

    document.dispatchEvent(reopenTable);
    document.getElementById('cancel').remove();
}

/**
* Summary: Submit sepcified rows to the SQL database for deletion
*
* Description: Stores the checked radio buttons in an array representing the indicies of rows to delete, then submits this array to the flask server
*/
function submitRemove(entryTable){
    let buttonContainer = document.getElementById('buttonContainer' + entryTable);
    let table = document.getElementById(entryTable);
    let rows = table.getElementsByTagName('tr');
    buttons = buttonContainer.childNodes;
    const toDelete = [];
    for(var i = 0; i < buttons.length; i++){
        if(buttons[i].checked){
            toDelete.push(i+1);
        }
    }
    fetch(flaskServer + '/deleteEntries', {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                table: entryTable,
                delete: toDelete
            })
    });
    buttonContainer.innerHTML = "";

    document.getElementById('removeEntry' + entryTable).textContent = "Remove Entry";
    document.getElementById('removeEntry' + entryTable).onclick = function () { startRemove(entryTable) };
    document.getElementById('cancel').remove();

    document.dispatchEvent(reopenTable);

}

/**
* Summary: Edits the contents of an existing cell
*
* Description: Opens a text input at the calling cell and submits any edits to that cell to the flask server based on index.
*/
function editEntry(){
if(!document.contains(document.getElementById('editEntryField'))){
    document.dispatchEvent(lockTable);
    let originalText = this.textContent;
    let row = this.parentElement;
    let index = row.id;
    let col = this.id;
    var table = row.parentElement.parentElement.id;
    this.innerHTML = ""
    this.innerHTML = `<td><input id="editEntryField" type="text" value="${originalText}"></input></td>`;
    let buttonContainer = document.getElementById('buttonContainer' + table);
    if(buttonContainer.childElementCount == 0){
        let submitEditButton = document.createElement("button");
        submitEditButton.innerHTML = "Submit Edit";
        buttonContainer.appendChild(submitEditButton);
        submitEditButton.onclick = function () {
            var newText = document.getElementById("editEntryField").value;
            
            console.log(newText);
            fetch(flaskServer + '/editTable', {
                method: "POST",
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify({
                    table: table,
                    Original: index,
                    Column: col,
                    Edit: newText
                })
        });
            buttonContainer.innerHTML = "";
            document.dispatchEvent(reopenTable);

            var newTable = [];
            newTable = getTable();
            createTable(table, newTable);                 
        }
    }
}
}