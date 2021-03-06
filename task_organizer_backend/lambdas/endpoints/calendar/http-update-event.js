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
  if (eventData.complete) {
    const listAdd = await Dynamo.list_remove(
      Tables.USERS,
      [{ sub: sub }],
      "events",
      [eventData.id]
    );
    await Dynamo.delete(Tables.EVENTS, { id: eventData.id });
  } else {
    const listAdd = await Dynamo.list_add(
      Tables.USERS,
      [{ sub: sub }],
      "events",
      [eventData.id]
    );
    await Dynamo.put(Tables.EVENTS, eventData);
  }
  return Responses._200({ message: "success", eventData, sub });
};
