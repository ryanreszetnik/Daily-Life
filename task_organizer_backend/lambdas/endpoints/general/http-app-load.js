const AWS = require("aws-sdk");
const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const Tables = require("../../common/TableConstants");
exports.handler = async (event) => {
  const sub = Formatting.getSub(event);
  const user = await Dynamo.get(Tables.USERS, { sub: sub });
  let taskObjs = [];
  let eventObjs = [];
  let links = user.links ? user.links : [];
  const courses = user.courses ? user.courses : [];
  if (user.tasks && user.tasks.values.length > 0) {
    taskObjs = await Dynamo.getMultiple(
      Tables.TASKS,
      user.tasks.values.map((t) => {
        return { id: t };
      })
    );
  }
  if (user.events && user.events.values.length > 0) {
    eventObjs = await Dynamo.getMultiple(
      Tables.EVENTS,
      user.events.values.map((t) => {
        return { id: t };
      })
    );
  }
  return Responses._200({
    message: "LETS GOOOO",
    user,
    tasks: taskObjs,
    courses,
    events: eventObjs,
    links,
  });
};
