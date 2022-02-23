const AWS = require("aws-sdk");
const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const Tables = require("../../common/TableConstants");
exports.handler = async (event) => {
  const sub = Formatting.getSub(event);
  const eventData = Formatting.ensureObject(event.body);
  const ret = await Dynamo.update(Tables.USERS, "sub", {
    sub,
    links: eventData,
  });
  return Responses._200(ret);
};
