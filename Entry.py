import datetime

class Entry:
    def __init__(self, name, notes):
        self.name = name
        self.notes = notes
        self.time = datetime.datetime.now()

    def to_sql_insert_query(self):
        time = self.time.strftime('MM-DD-YYYY')
        query = f"""INSERT INTO artists VALUES ("{self.name}", "{self.notes}", "{time}");"""
        return query

    def to_sql_delete_query(self):
        query = f"""DELETE FROM artists WHERE name='{self.name}'"""
        return query
