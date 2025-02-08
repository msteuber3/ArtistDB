import datetime
import sqlite3
from pathlib import Path

class Entry:
    def __init__(self, name, notes, db):
        self.name = name
        self.notes = notes
        self.time = datetime.datetime.now()
        self.db = db
        self.set_index()


    def to_sql_insert_query(self):
        time = self.time.strftime('%m-%d-%Y')
        query = f"""INSERT INTO {self.db} VALUES ({self.index}, "{self.name}", "{self.notes}", "{time}");"""
        return query

    def to_sql_delete_query(self):
        query = f"""DELETE FROM {self.db} WHERE name='{self.name}'"""
        return query
    
    def set_index(self):
        dbFile = Path('artists.db')
        conn = sqlite3.connect('artists.db')
        cur = conn.cursor()
        query = f"""SELECT COUNT(*) FROM {self.db}"""
        cur.execute(query)
        conn.commit()
        index = cur.fetchone()[0] + 1
        conn.close()
        self.index = index

