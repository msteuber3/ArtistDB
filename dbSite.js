/*
        * Summary: Function that loads the table on page load
        *  
        * Description: Fetches JSON of table elements from getTable() and passes
        *              it to createTable after the getTable fetch is complete.
        */
async function loadStart(){
    var json_data = await getTable()
  
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
    await fetch('http://127.0.0.1:5000/getTable')
    .then( response => response.json() )
    .then( data =>  json_data = data['data'] )
    .catch((error) => console.error(error))
    return json_data;
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
    for(var artist in new_json[table]){
        var newRow = document.getElementById(table).insertRow();
        newRow.id =  `${new_json[table][artist]['ind']}`;
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
    }
}

/*
* Summary: 
*
* Description: 
* 
* @TODO: pass the table id as a parameter
*/
function addEntry(entryTable){
    var tableRef = document.getElementById(entryTable);
    var newRow = tableRef.insertRow();
    var newNameCell = newRow.insertCell(0);
    var newNoteCell = newRow.insertCell(1);

    var newNameIn = document.createElement('input');
    newNameIn.type = 'text';
    newNameIn.id = 'newName';
    newNameCell.appendChild(newNameIn);

    var newNoteIn = document.createElement('input');
    newNoteIn.type = 'text';
    newNoteIn.id = 'newNote';
    newNoteCell.appendChild(newNoteIn);

    document.getElementById('addEntry' + entryTable).textContent = "Submit";
    document.getElementById('addEntry' + entryTable).onclick = function () { submitEntry(entryTable); }
    console.log("tried to submit entry");
}

/*
* Summary: 
*
* Description: 
*/

function submitEntry(table){
    var name = document.getElementById('newName').value;
    var note = document.getElementById('newNote').value;
    console.log("Submitting entry");
    fetch('http://127.0.0.1:5000/addEntry', {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            table: table,
            name: name,
            note: note
        })
});

    newTable = [];
    newTable = getTable();
    createTable(newTable[table]);

    document.getElementById('addEntry' + table).textContent = "Add Entry";
    document.getElementById('addEntry' + table).onclick = function () { addEntry(table); }

}

/*
* Summary: 
*
* Description: 
*/
function startRemove(entryTable){
    let table = document.getElementById(entryTable);
    let rows = table.getElementsByTagName('tr');
    let buttonContainer = table.parentElement.getElementById('buttonContainer');
    const delButtons = []
    for (let i = 1; i < rows.length; i++) {
        let row = rows[i];
        newButton = document.createElement("INPUT");
        newButton.setAttribute("type", "radio");
        newButton.id = i;
        newButton.onclick = function () {
            this.checked = !this.tag;
            row.classList.toggle("strikethrough");
            this.tag = this.checked;
        }
        buttonContainer.appendChild(newButton);
}
    document.getElementById('removeEntry').textContent = "Submit Remove";
    document.getElementById('removeEntry').onclick = submitRemove(entryTable);
}

/*
* Summary: 
*
* Description: 
*/
function submitRemove(entryTable){
let buttonContainer = entryTable.parentElement.getElementById('buttonContainer');
let table = document.getElementById(entryTable);
let rows = table.getElementsByTagName('tr');
buttons = buttonContainer.childNodes;
const toDelete = [];
for(var i = 0; i < buttons.length; i++){
    if(buttons[i].checked){
        toDelete.push(i+1);
    }
}
fetch('http://127.0.0.1:5000/deleteEntries', {
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

document.getElementById('removeEntry').textContent = "Remove Entry";
document.getElementById('removeEntry').onclick = startRemove;
}

/*
* Summary: 
*
* Description: 
*/
function editEntry(){
if(!document.contains(document.getElementById('editEntryField'))){
    let originalText = this.textContent;
    let index = this.parentElement.id;
    let col = this.id;
    var table = this.parentElement.parentElement.id;
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
            fetch('http://127.0.0.1:5000/editTable', {
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

            var newTable = [];
            newTable = getTable();
            createTable(table, newTable);
        }
    }
}
}