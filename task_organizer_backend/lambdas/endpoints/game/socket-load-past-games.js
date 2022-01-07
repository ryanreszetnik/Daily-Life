const AWS = require("aws-sdk");
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const SocketConstants = require("../../common/SocketConstants");
const Tables = require("../../common/TableConstants");
exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const callingSub = await Database.getSubFromConnection(connectionId);
  const user = await Dynamo.get(Tables.USERS, { sub: callingSub });
  const allGames = await Dynamo.getMultiple(
    Tables.GAMES,
    user.games.values.map((g) => {
      return { id: g };
    })
  );
  const resp = allGames.filter((g) => g.isFinished);
  return Responses._200_socket(SocketConstants.SOCKET_LOAD_PAST_GAMES, resp);
};
