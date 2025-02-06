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

def remove_entry(db, entry: Entry):
    cur = db.cursor()
    cur.execute(entry.to_sql_delete_query())
    db.commit()

@app.route('/deleteEntries', methods=['GET', 'POST'])
def delete_entries_from_remote():
    entries = request.get_json()
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    for delEntry in entries['delete']:
        toDel = Entry(delEntry[1], delEntry[2])
        remove_entry(conn, toDel)
    conn.close()
    return "200"


@app.route('/getTable', methods=['GET'])
def get_html_table():
    dbFile = Path('artists.db')
    conn = sqlite3.connect(dbFile)
    df = pd.read_sql("SELECT * FROM artists", conn)
    htmlTable = df.to_html()
    response = jsonify({'data' : htmlTable})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


def main():
    dbFile = Path('artists.db')
    if not dbFile.exists():
        Setup()
    conn = sqlite3.connect(dbFile)
    beatles = Entry("The-Beatles", "Good-band")
    add_entry(conn, beatles)


if __name__ == "__main__":
    app.run(host="0.0.0.0")