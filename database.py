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

def Setup():
    conn = sqlite3.connect('artists.db')

    cur = conn.cursor()

    query = """CREATE TABLE artists (
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
    newEntry = Entry(data['name'], data['note'])
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    add_entry(conn, newEntry)
    conn.close()
    return "200"

def remove_entry(db, index):
    cur = db.cursor()
    query = (f"""DELETE FROM artists WHERE ind={int(index)}""")
    cur.execute(query)
    db.commit()

@app.route('/deleteEntries', methods=['GET', 'POST'])
def delete_entries_from_remote():
    entries = request.get_json()
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    for delEntry in entries['delete']:
        remove_entry(conn, delEntry)

    cur = conn.cursor()
    query = f"""SELECT COUNT(*) FROM artists"""
    cur.execute(query)
    conn.commit()
    index = cur.fetchone()[0]

    cur.execute("SELECT rowid FROM artists ORDER BY rowid") 
    rowids = [row[0] for row in cur.fetchall()]

    query = f"""UPDATE artists SET ind=? WHERE rowid=?"""
    cur.executemany(query, list(zip(range(1, index + 1), rowids)))
    conn.commit()
    conn.close()
    return "200"


@app.route('/getTable', methods=['GET'])
def get_html_table():
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    df = pd.read_sql("SELECT * FROM artists", conn)
    json_response = df.to_dict(orient='records')
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
    conn = sqlite3.connect(dbFile)
    query = f"""UPDATE artists SET {column}="{newText}" WHERE ind={int(index)}"""
    cur = conn.cursor()
    cur.execute(query)
    conn.commit()
    conn.close()
    return "200"

def main():
    dbFile = Path('artists.db')
    Setup()


if __name__ == "__main__":
 #  main()
    app.run(host="0.0.0.0")