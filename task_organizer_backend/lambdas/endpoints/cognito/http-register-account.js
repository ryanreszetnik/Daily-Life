const AWS = require("aws-sdk");
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const SocketConstants = require("../../common/SocketConstants");
const Tables = require("../../common/TableConstants");
exports.handler = async (event, context, callback) => {
  // TODO implement
  if (event.triggerSource != "PostConfirmation_ConfirmSignUp") {
    callback(null, event);
  }
  try {
    await Dynamo.put(Tables.USERS, {
      sub: event.request.userAttributes.sub,
      username: event.request.userAttributes.name,
      email: event.request.userAttributes.email,
      courses: [],
    });
  } catch (err) {
    callback(JSON.stringify(err));
  }
  callback(null, event);
};
