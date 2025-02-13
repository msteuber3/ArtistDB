const lockTable = new CustomEvent("lockTable");
const reopenTable = new CustomEvent("reopenLockedTable");
document.addEventListener("lockTable", lockDownTable);
document.addEventListener("reopenLockedTable", reopenLockedTable);

const flaskServer = "http://127.0.0.1:5000";

window.addEventListener("load", loadStart); //TODO: Look more into this, see what the actual best way of handling this is. Is it the onload or this?

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

/*
        * Summary: Function that loads the table on page load
        *  
        * Description: Fetches JSON of table elements from getTable() and passes
        *              it to createTable after the getTable fetch is complete.
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

/*
* Summary: Fetches the elements of the SQL database as JSON.
*
* Description: Submits a GET request to the python flask server at route /getTable and 
*              stores the contents of the data field in json_data.
* 
* @return JSON of SQL database contents
*/
async function getTable(){
    var json_data
    await fetch(flaskServer + '/getTable')
    .then( response => response.json() )
    .then( data =>  json_data = data['data'] )
    .catch((error) => console.error(error))
    return Promise.resolve(json_data);
}

/* 
* Summary: Formats the name, notes, and date from the SQL database as an HTML table and appends to main table.
*
* Description: Creates and populates a new row in the toListenTable element. Each row's ID corresponds to the 
*              index value from the SQL database. The name and note cells all have the same ID (name and notes 
*              respectively) and call the editEntry function on click. The date cell is only displayed. 
* 
* @param JSON new_json the JSON recieved from the SQL database
* 
* @TODO: pass table id as a parameter
*        use table id to generate row ids
*/
function createTable(table, new_json){
    console.log("creating table");
    var tableBody = document.querySelector(`#${table} tbody`);
    for(var i = 1; i < tableBody.childElementCount; i++){
        tableBody.childNodes[i].remove();
    }
    for(var artist in new_json[table]){
        var newRow = document.getElementById(table).insertRow();
        newRow.id =  `${new_json[table][artist]['ind']}`;
        if(table == "toListen"){
            newRow.addEventListener("mouseover", createSwapButton);
        }
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
   // updateCss(table);

}

function updateCss(entryTable){ //Dont think i need this
    let table = document.getElementById(entryTable);
    let tableDiv = table.parentElement;
    let rect = table.getBoundingClientRect();

    tableDiv.style.width = (rect.width + 40) + "px";
    tableDiv.style.height = (rect.height + 60) + "px";
    tableDiv.style.left = (rect.left + 40) + "px";
    tableDiv.style.top = (rect.top + 40) + "px";

}

function createSwapButton(){
    if(document.getElementById('swapButton')){
        document.getElementById('swapButton').remove();
    }
    let swap = document.createElement('button');
  //  swap.innerHTML = "<img src='./icons/aphextwin.png' class='aphex-image' style='top:0px; left:0px; width:30px; height:30px;' alt='->'/>";
    swap.innerHTML = "<b>---></b>"
    let rect = this.getBoundingClientRect();
    swap.style.width = "50px";
    swap.style.height = "20px";
    swap.style.position = "absolute";
    swap.style.top = (rect.top + ((rect.height / 2) - 9.5)) + "px"; //9.5 is my best guess
    swap.style.left = (rect.width + 40) + "px";
    swap.classList.add("swap-button");

    swap.id = 'swapButton';
    this.parentElement.parentElement.parentElement.appendChild(swap);

    var index = this.id;
    var toDelete = [index];
    var name = this.cells[0].innerHTML;
    var notes = this.cells[1].innerHTML;
    swap.onclick = async function(){

        await fetch(flaskServer + '/addEntry', {
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
        
        await fetch(flaskServer + '/deleteEntries', {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                table: 'toListen',
                delete: toDelete
            })
    });
    let newTable = [];
    getTable().then((newTab) => newTable = newTab);
    createTable('listened', newTable);
    createTable('toListen', newTable);

}
}

/*
* Summary: 
*
* Description: 
* 
* @TODO: pass the table id as a parameter
*/
function addEntry(entryTable){ // TODO: cancel button
    document.dispatchEvent(lockTable);
    var tableRef = document.getElementById(entryTable);
    var newRow = tableRef.insertRow();
    var newNameCell = newRow.insertCell(0);
    var newNoteCell = newRow.insertCell(1);

    var newNameIn = document.createElement('input');
    newNameIn.type = 'text';
    newNameIn.id = 'newName';
    newNameIn.addEventListener('input', () => validateEntry('addEntry' + entryTable));
    newNameCell.appendChild(newNameIn);
    validateEntry('addEntry' + entryTable);

    var newNoteIn = document.createElement('input');
    newNoteIn.type = 'text';
    newNoteIn.id = 'newNote';
    newNoteIn.addEventListener('input', () => validateEntry('addEntry' + entryTable));
    newNoteCell.appendChild(newNoteIn);
    validateEntry('addEntry' + entryTable);

    var cancelButton = document.createElement('button');
    cancelButton.innerHTML = "Cancel";
    cancelButton.id = 'cancel';

    document.getElementById('addEntry' + entryTable).disabled = false;  
    document.getElementById('addEntry' + entryTable).textContent = "Submit";
    document.getElementById('addEntry' + entryTable).onclick = function () { submitEntry(entryTable) };

    cancelButton.onclick = function () { submitCancelEnter(entryTable, tableRef, newRow) };
    document.getElementById('addEntry' + entryTable).parentElement.appendChild(cancelButton);
}

function submitCancelEnter(entryTable, table, row){
    document.getElementById('newName').remove();
    document.getElementById('newNote').remove();
    row.remove();
    
    document.getElementById('addEntry' + entryTable).textContent = "Add Entry";
    document.getElementById('addEntry' + entryTable).onclick = function () { addEntry(entryTable) }; //TODO: Get rid of this mayhaps

    document.dispatchEvent(reopenTable);
    document.getElementById('cancel').remove();

}
/*
* Summary: 
*
* Description: 
*/

async function submitEntry(table){ //TODO: Pass the values in as parameters
    var name = htmlSanitize(document.getElementById('newName').value);
    var note = htmlSanitize(document.getElementById('newNote').value);
    console.log("Submitting entry");
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
}).then(response => response.json())
  .then(json_data => { if(json_data['response'] == '400'){ handleDuplicate(json_data, table) }});

    newTable = [];
    getTable().then((newTab) => newTable = newTab); //TODO: Standardize
    createTable(table, newTable);

    document.getElementById('addEntry' + table).textContent = "Add Entry";
    document.getElementById('addEntry' + table).onclick = function () { addEntry(table) }; 
    document.getElementById('cancel').remove();
    document.dispatchEvent(reopenTable);
}

function handleDuplicate(input, entryTable){
    if(confirm(input['message'] + " Append new note to old entry?")){
        fetch(flaskServer + '/editTable', {    
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({
                table: entryTable,
                Original: input['data']['old'][entryTable]['ind'][0],
                Column: 'notes',
                Edit: input['data']['old'][entryTable]['notes'][0] + '\n' + input['data']['new'][entryTable]['notes']
                
            })
    });
}
}

function validateEntry(button){
    if(document.getElementById('newName').value == "" || document.getElementById('newNote').value == ""){
        document.getElementById(button).disabled = true;
    }
    else{
        document.getElementById(button).disabled = false;
    }
}

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
    return input.replace(regEsc, (match)=>(map[match]));
}

/*
* Summary: 
*
* Description: 
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
        newButton.classList.add("delete-button"); // TODO: Do i need this? Actually yeah. To make the button look like not shit.

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

function submitCancelRemove(entryTable){
    document.getElementById('buttonContainer' + entryTable).innerHTML = "";  // For future Michael: weird cancel button issues are likely due to you forgetting that something's local
                                                                             // so the submitCancel function dies before it does anything. OR ITS CAUSE YOURE STUPID AND DONT KNOW HOW TO HANDLE EVENT LISTENERS
                                                                             //DUMBASS

    document.getElementById('removeEntry' + entryTable).textContent = "Remove Entry";
    document.getElementById('removeEntry' + entryTable).onclick = function () { startRemove(entryTable) };

    document.dispatchEvent(reopenTable);
    document.getElementById('cancel').remove();
}

/*
* Summary: 
*
* Description: 
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

/*
* Summary: 
*
* Description: 
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
                
            //TODO: Standardize this thing
        }
    }
}
}