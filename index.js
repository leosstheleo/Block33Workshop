require('dotenv').config()

const pg = require('pg');
const express = require('express');
const app = express();
app.use(express.json()); //parses req.bodies

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');

const init = async () => {
    await client.connect();
    console.log('db connected');
    
    // SQL tables step
    let SQL = /*SQL*/ `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        
        CREATE TABLE departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100)
        );
        CREATE TABLE employees (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            name VARCHAR(100),
            department_id INTEGER REFERENCES departments(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log('tables created');
 
    SQL = /*SQL*/`
        INSERT INTO departments(name) VALUES('HR');
        INSERT INTO departments(name) VALUES('IT');
        INSERT INTO employees(name, department_id) VALUES('John Doe', 1);
        INSERT INTO employees(name, department_id) VALUES('Jane Smith', 2);
    `;
    await client.query(SQL);
    console.log('tables seeded');
    
    const port = process.env.PORT;
    app.listen(port, () => console.log(`listening on port ${port}`));
};

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});

app.get('/api/departments', async (req, res, next) => {
    try {
        let SQL = /*SQL*/ `SELECT * from departments`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

app.get('/api/employees', async (req, res, next) => {
    try {
        let SQL = /*SQL*/ `SELECT * from employees`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = /*SQL*/ `INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *`;
        console.log('req.body = ', req.body);
        const response = await client.query(SQL, [req.body.name, req.body.department_id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

init();
