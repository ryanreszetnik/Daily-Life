const Dynamo = require("./dynamo");
const Tables = require("./TableConstants");

const getSubFromConn = async (connId) => {
  return (await Dynamo.get(Tables.CONNECTIONS, { connId: connId })).sub;
};

const Responses = {
  async getSubFromConnection(connId = "") {
    return await getSubFromConn(connId);
  },
};

module.exports = Responses;
