const AWS = require("aws-sdk");
const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const Tables = require("../../common/TableConstants");
exports.handler = async (event) => {
  const eventData = Formatting.ensureObject(event.body);
  await Dynamo.delete(Tables.EVENTS, { id: eventData.id });
  return Responses._200({ message: "success" });
};
