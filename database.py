import sqlite3
import pandas as pd
from dataclasses import dataclass
import datetime
from pathlib import Path
from Entry import *
from flask import Flask, request
from flask import jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# TODO: Add second table and pass table name as a parameter
# TODO: Change table name to toListen and listened
# TODO: Perhaps edit response codes to something better than "200" every time

def Setup():
    conn = sqlite3.connect('artists.db')

    cur = conn.cursor()

    query = """CREATE TABLE toListen (
            ind int,
            name text,
            notes text,
            date text
            )"""

    cur.execute(query)

    query = """CREATE TABLE listened (
            ind int,
            name text,
            notes text,
            date text
            )"""

    cur.execute(query)

    conn.commit()
    conn.close()

def add_entry(db, entry: Entry):
    cur = db.cursor()
    query = entry.to_sql_insert_query()
    cur.execute(query)
    db.commit()

@app.route('/addEntry', methods=['GET', 'POST'])
def add_entry_from_remote():
    data = request.get_json()
    dupes = check_duplicates(data)
    if dupes != "200":
        dupes.headers.add("response", "400")
        return dupes
    else: 
        newEntry = Entry(data['name'], data['note'], data['table'])
        dbFile = Path('artists.db')
        conn = sqlite3.connect(dbFile)
        add_entry(conn, newEntry)
        conn.close()
        return "200"

def remove_entry(db, index, table):
    cur = db.cursor()
    query = (f"""DELETE FROM {table} WHERE ind={int(index)}""")
    cur.execute(query)
    db.commit()

@app.route('/deleteEntries', methods=['GET', 'POST'])
def delete_entries_from_remote():
    entries = request.get_json()
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    table = entries['table']
    for delEntry in entries['delete']:
        remove_entry(conn, delEntry, table)

    cur = conn.cursor()
    query = f"""SELECT COUNT(*) FROM {table}"""
    cur.execute(query)
    conn.commit()
    index = cur.fetchone()[0]

    cur.execute(f"SELECT rowid FROM {table} ORDER BY rowid") 
    rowids = [row[0] for row in cur.fetchall()]

    query = f"""UPDATE {table} SET ind=? WHERE rowid=?"""
    cur.executemany(query, list(zip(range(1, index + 1), rowids)))
    conn.commit()
    conn.close()
    return "200"


@app.route('/getTable', methods=['GET'])
def get_html_table():
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    json_response = {'listened': "", 'toListen': ""}
    df = pd.read_sql("SELECT * FROM listened", conn)
    json_response['listened'] = df.to_dict(orient='records')
    df = pd.read_sql("SELECT * FROM toListen", conn)
    json_response['toListen'] = (df.to_dict(orient='records'))
    response = jsonify({'data' : json_response})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/editTable', methods=['GET', 'POST'])
def edit_db_entry():
    data = request.get_json()
    index = data['Original']
    newText = data['Edit']
    column = data['Column']
    dbFile = Path('artists.db')
    table = data['table']
    conn = sqlite3.connect(dbFile)
    query = f"""UPDATE {table} SET {column}="{newText}" WHERE ind={int(index)}"""
    cur = conn.cursor()
    cur.execute(query)
    conn.commit()
    conn.close()
    return "200"

def check_duplicates(input):
    conn = sqlite3.connect('artists.db')
    cur = conn.cursor()
    query = f"""SELECT name, ind, notes, date FROM {input['table']} WHERE LOWER(name) LIKE LOWER('{input['name']}')"""
    cur.execute(query)
    df = pd.read_sql(query, conn)
    if not df.empty:
        data = {'old': {input['table'] : "" }, 'new':""}
        data['new'] = { input['table']: {'name': input['name'], 'notes': input['note']}}
        data['old'][input['table']] = df.to_dict(orient='list')
        print(data)
        json_message = jsonify({ 'response':"400", 'data': data, 'message':f"Duplicate data detected: input name matches {data['old'][input['table']]['name']} from {data['old'][input['table']]['date']} (index: {data['old'][input['table']]['ind']})"})
        return json_message
    else:
        return "200"

def main():
    dbFile = Path('artists.db')
    Setup()


if __name__ == "__main__":
 #  main()
    app.run(host="0.0.0.0")