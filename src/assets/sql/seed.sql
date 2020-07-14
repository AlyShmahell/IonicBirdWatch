CREATE TABLE IF NOT EXISTS filters(id INTEGER PRIMARY KEY, textt TEXT, maxd TEXT, mind TEXT, typ TEXT, bywho TEXT, lon FLOAT, lat FLOAT, area FLOAT)
CREATE TABLE IF NOT EXISTS wildlife(id INTEGER PRIMARY KEY, userid INTEGER, typ TEXT, species TEXT, notes TEXT, lon FLOAT, lat FLOAT, dist TEXT, datee TEXT, photo TEXT)
