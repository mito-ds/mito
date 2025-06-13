-- Copyright (c) Saga Inc.
-- Distributed under the terms of the GNU Affero General Public License v3.0 License.

connect  test_user/test_pass@xepdb1;

create sequence hibernate_sequence start with 1 increment by 1;

create table department (id integer not null, name varchar(255), primary key (id));

create table employee (id integer not null, email varchar(255), first_name varchar(255), gender varchar(255), last_name varchar(255), salary numeric(19,2), department_id integer, primary key (id));

insert into department (id, name) values (1, 'IT');
insert into department (id, name) values (2, 'HR');
insert into department (id, name) values (3, 'Finance');

insert into employee (id, email, first_name, gender, last_name, salary, department_id) values (1, 'john.doe@example.com', 'John', 'M', 'Doe', 50000, 1);
insert into employee (id, email, first_name, gender, last_name, salary, department_id) values (2, 'jane.smith@example.com', 'Jane', 'F', 'Smith', 55000, 2);
insert into employee (id, email, first_name, gender, last_name, salary, department_id) values (3, 'jim.beam@example.com', 'Jim', 'M', 'Beam', 60000, 3);

COMMIT;
