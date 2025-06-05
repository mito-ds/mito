-- Copyright (c) Saga Inc.
-- Distributed under the terms of the GNU Affero General Public License v3.0 License.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);
