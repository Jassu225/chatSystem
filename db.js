const mysql = require('mysql');
const util = require('util');

const dbName = "chat_system";

const dbLocalConfig = {
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : dbName
};

const dbConfig = {
  host     : 'https://stream-me.000webhostapp.com/',
  user     : 'id2408532_chat_system',
  password : 'password',
  database : 'id2408532_chat_system'
}

const tables = {
  userData: "CREATE TABLE IF NOT EXISTS userdata (email VARCHAR(60) NOT NULL, id BIGINT(20) NOT NULL AUTO_INCREMENT, username VARCHAR(20) NOT NULL, password VARCHAR(100) NOT NULL, friendsIDs VARCHAR(1000000), PRIMARY KEY (id), UNIQUE (email) ) ENGINE = InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci",
  msg: "CREATE TABLE IF NOT EXISTS messages (senderID BIGINT NOT NULL, receiverID BIGINT NOT NULL, msg VARCHAR(10000) NOT NULL, msgID VARCHAR(100) NOT NULL, msgType INT NOT NULL, status INT NOT NULL, PRIMARY KEY(senderID, msgID) ) ENGINE = InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci",
  grpData: "CREATE TABLE IF NOT EXISTS grpdata (id VARCHAR(100) NOT NULL, name VARCHAR(100) NOT NULL, ownerID BIGINT NOT NULL, membersIDs VARCHAR(1000), PRIMARY KEY(id) ) ENGINE = InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci",
  grpMsgs: "CREATE TABLE IF NOT EXISTS grpmessages (id VARCHAR(100) NOT NULL, senderID BIGINT NOT NULL, senderName VARCHAR(100) NOT NULL, msg VARCHAR(10000) NOT NULL, msgID VARCHAR(100) NOT NULL, msgType INT NOT NULL, status INT NOT NULL, PRIMARY KEY(id, msgID)) ENGINE = InnoDB CHARACTER SET utf8 COLLATE utf8_general_ci"
};

const db = {
  connection: null,
  
  connect: function() {
    this.connection = mysql.createConnection(dbLocalConfig);
    
    this.connection.connect();

    this.promisifyQuery();

    // Database existence check
    // this.checkDatabase();

    // Tables existence check
    this.checkUserTable();
    this.checkMsgsTable();
    this.checkGrpDataTable();
    this.checkGrpMsgsTable();
  },
  
  disconnect: function() {
    this.connection.end();
    this.connection = null;
  },

  promisifyQuery: function() {
    this.connection.query = util.promisify(this.connection.query);
  },

  checkDatabase: function() {
    this.exec("CREATE DATABASE IF NOT EXISTS chat_system");
  },

  checkUserTable: function() {
    this.exec(tables.userData);
  },

  checkMsgsTable: function() {
    this.exec(tables.msg);
  },

  checkGrpDataTable: function() {
    this.exec(tables.grpData);
  },

  checkGrpMsgsTable: function() {
    this.exec(tables.grpMsgs);
  },

  addUser: async function(user) {
    const query = `INSERT INTO userdata(email, username, password) VALUES('${user.email}', '${user.username}' , '${user.password}')`;
    return await this.exec(query);
  },

  verifyUser: async function(user) {
    const query = `SELECT email, password, username, id, friendsIDs FROM userdata WHERE email='${user.email}' AND password='${user.password}'`;
    return await this.exec(query);
  },

  getFriendsIDs: async function(id) {
    const query = `SELECT friendsIDs FROM userdata WHERE id = ${id}`;
    return await this.exec(query);
  },
  
  getFriendsData: async function(ids) {
    const query = `SELECT id, username, email FROM userdata WHERE id IN (${ids}) `;
    return await this.exec(query);
  },

  getChat: async function(ids) {
    const query1 = `SELECT msg, msgID, msgType, status FROM messages WHERE senderID = ${ids.senderID} AND receiverID = ${ids.receiverID}`;
    let sent = await this.exec(query1);

    const query2 = `SELECT msg, msgID, msgType, status FROM messages WHERE senderID = ${ids.receiverID} AND receiverID = ${ids.senderID}`;
    let received = await this.exec(query2);

    return {
      sent: sent,
      received: received
    };
  },

  updateMsgStatus: async function(data) {
    const query = `UPDATE messages SET status = 1 WHERE msgID = ${data.msgID}`;
    return await this.exec(query);
  },

  searchUser: async function(keyword, email) {
    const query = `SELECT username, email, id FROM userdata WHERE email != '${email}' AND username COLLATE UTF8_GENERAL_CI LIKE '${keyword}%'`;
    return await this.exec(query);
  },
  
  addFriend: async function(data) {
    const query1 = `SELECT email,username, friendsIDs FROM userdata WHERE id = ${data.id}`;
    let result1 = await this.exec(query1);
    console.log(result1);
    const query2 = `UPDATE userdata SET friendsIDs = '${result1[0].friendsIDs ? (result1[0].friendsIDs + ';'):''}${data.targetID}' WHERE id = ${data.id}`;
    let result2 = await this.exec(query2);
    console.log(result2);
  },

  makeFriends: async function(data) {
    // let senthis.addFriend(data);
    const query1 = `SELECT email,username, friendsIDs FROM userdata WHERE id = ${data.id}`;
    let result1 = await this.exec(query1);
    console.log(result1);
    const query2 = `UPDATE userdata SET friendsIDs = '${result1[0].friendsIDs ? (result1[0].friendsIDs + ';'):''}${data.targetID}' WHERE id = ${data.id}`;
    let result2 = await this.exec(query2);
    console.log(result2);

    const query3 = `SELECT friendsIDs FROM userdata WHERE id = ${data.targetID}`;
    let result3 = await this.exec(query3);
    console.log(result3);
    const query4 = `UPDATE userdata SET friendsIDs = '${result3[0].friendsIDs ? (result3[0].friendsIDs + ';'):''}${data.id}' WHERE id = ${data.targetID}`;
    let result4 = await this.exec(query4);
    console.log(result4);

    return {
      id: data.id,
      username: result1[0].username,
      email: result1[0].email
    };
  },

  saveMsg: async function(data) {
    const query = `INSERT INTO messages (senderID, receiverID, msg, msgID, msgType, status) VALUES (${data.senderID}, ${data.receiverID}, '${data.msg}', '${data.msgID}', ${data.msgType}, ${data.status})`;
    return await this.exec(query);
  },
  
  getReceiverID: async function(msgID) {
    const query = `SELECT receiverID FROM messages WHERE msgID = ${msgID}`;
    return await this.exec(query);
  },

  deleteMsgs: async function(msgIDs) {
    const query = `UPDATE messages SET msg ='<i class="deleted-msg">This message was deleted</i>', status = -1 WHERE msgID IN ${msgIDs}`;
    return await this.exec(query);
  },

  createGroup: async function(data) {
    const query = `INSERT INTO grpdata (id, name, ownerID, membersIDs) VALUES('${data.grpID}', '${data.grpName}', ${data.ownerID}, '${data.ids.join(";")};${data.ownerID}')`;
    return await this.exec(query);
  },

  getGroupsList: async function(id) {
    const query = `SELECT * FROM grpdata WHERE membersIDs LIKE '${id};%' OR membersIDs LIKE '%;${id};%' OR membersIDs LIKE '%;${id}'`;
    return await this.exec(query);
  },

  getGroupChat: async function(id) {
    const query = `SELECT * FROM grpmessages WHERE id = '${id}'`;
    return await this.exec(query);
  },

  saveGroupMsg: async function(msg) {
    const query = `INSERT INTO grpmessages (id, senderID, senderName, msg, msgID, msgType, status) VALUES('${msg.id}',${msg.senderID}, '${msg.senderName}','${msg.msg}','${msg.msgID}',${msg.msgType},-2)`;
    return await this.exec(query);
  },

  deleteGrpMsgs: async function(msgIDs) {
    const query = `UPDATE grpmessages SET msg ='<i class="deleted-msg">This message was deleted</i>', status = -1 WHERE msgID IN ${msgIDs}`;
    return await this.exec(query);
  },

  getMembersIDs: async function(id) {
    const query = `SELECT membersIDs FROM grpdata WHERE id = '${id}'`;
    return await this.exec(query);
  },

  addGrpMember: async function(data) {
    const query = `UPDATE grpdata SET membersIDs = concat(ifnull(membersIDs, ""), ';${data.id}') WHERE id = '${data.grpID}'`;
    return await this.exec(query);
  },

  findGrpMember: async function(data) {
    let id = data.id;
    const query = `SELECT * FROM grpdata WHERE (membersIDs LIKE '${id};%' OR membersIDs LIKE '%;${id};%' OR membersIDs LIKE '%;${id}') AND id = '${data.grpID}'`;
    return await this.exec(query);
  },

  getGrpData: async function(data) {
    const query = `SELECT * FROM grpdata WHERE id = '${data.grpID}'`;
    return await this.exec(query);
  },

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