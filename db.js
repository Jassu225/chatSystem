const mysql = require('mysql');
const util = require('util');

const dbName = "chat_system";

const tables = {
  userData: "CREATE TABLE IF NOT EXISTS userdata (email VARCHAR(60) NOT NULL, username VARCHAR(20) NOT NULL, password VARCHAR(100) NOT NULL, PRIMARY KEY (email) ) ENGINE = InnoDB"
};

const db = {
  connection: null,
  
  connect: function() {
    this.connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : '',
      database : dbName
    });
    
    this.connection.connect();

    this.promisifyQuery();
  },
  
  disconnect: function() {
    this.connection.end();
    this.connection = null;
  },

  promisifyQuery: function() {
    this.connection.query = util.promisify(this.connection.query);
  },

  checkUserTable: function() {
    this.exec(tables.userData);
  },

  addUser: async function(user) {
    const query = `INSERT INTO userdata VALUES('${user.email}', '${user.username}' , '${user.password}')`;
    return await this.exec(query);
  },

  verifyUser: async function(user) {
    const query = `SELECT email, password, username FROM userdata WHERE email='${user.email}' AND password='${user.password}'`;
    return await this.exec(query);
  },

  searchUser: async function(keyword) {},
  
  exec: async function(query) {

    try {
      return (await this.connection.query(query));
    }
    catch(err) {
      console.log(err);
      return {err: err};
    };
  }
};

module.exports = db;