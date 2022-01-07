const AWS = require("aws-sdk");
const Dynamo = require("../dynamo");
const Tables = require("../TableConstants");

const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: "2018-11-29",
  endpoint: "9jk75rxjd3.execute-api.ca-central-1.amazonaws.com/dev",
});

const removeConnection = async (connId) => {
  await Dynamo.delete(Tables.CONNECTIONS, { connId: connId });
};
const sendCallConnections = async (
  action,
  body,
  connections,
  ignoreConnection
) => {
  const postCalls = connections.map(async (connId) => {
    try {
      if (connId !== ignoreConnection) {
        await apigwManagementApi
          .postToConnection({
            ConnectionId: connId,
            Data: JSON.stringify({
              action: action,
              body: body,
            }),
          })
          .promise();
        console.log("Successfully Sent To", connId);
      }
    } catch (e) {
      if (e.statusCode === 410) {
        console.log("Trying to remove", connId);
        await removeConnection(connId);
      } else {
        throw e;
      }
    }
  });
  console.log("Sending message", action, body, connections, ignoreConnection);
  try {
    await Promise.all(postCalls);
  } catch (e) {
    console.log("ERROR", e);
    return e.stack;
  }
  return connections;
};

const Responses = {
  async sendToConnections(action, body, connIds, ignore = null) {
    return await sendCallConnections(action, body, connIds, ignore);
  },
  async sendToAllConnections(action, body, ignore = null) {
    const allConns = (await Dynamo.scan(Tables.CONNECTIONS)).map(
      (p) => p.connId
    );
    return await sendCallConnections(action, body, allConns, ignore);
  },
};

module.exports = Responses;
