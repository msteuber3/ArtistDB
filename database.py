import sqlite3
import pandas as pd
from dataclasses import dataclass
import datetime
from pathlib import Path
from Entry import *


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
    cur.execute(entry.to_sql_insert_query())
    db.commit()


def remove_entry(db, entry: Entry):
    cur = db.cursor()
    cur.execute(entry.to_sql_delete_query())
    db.commit()


def main():
    dbFile = Path('artists.db')
    if not dbFile.exists():
        Setup()
    conn = sqlite3.connect(dbFile)


if __name__ == "__main__":
    main()