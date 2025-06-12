-- Copyright (c) Saga Inc.
-- Distributed under the terms of the GNU Affero General Public License v3.0 License.

connect  test_user/test_pass@xepdb1;

create sequence hibernate_sequence start with 1 increment by 1;

create table department (id integer not null, name varchar(255), primary key (id));

create table employee (id integer not null, birth_date date, email varchar(255), first_name varchar(255), gender varchar(255), hire_date date, last_name varchar(255), salary numeric(19,2), department_id integer, primary key (id));

COMMIT;
