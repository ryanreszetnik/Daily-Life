const AWS = require("aws-sdk");
const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const Tables = require("../../common/TableConstants");

const deleteTask = async (id, sub) => {
  await Dynamo.delete(Tables.TASKS, { id: id });
  await Dynamo.list_remove(Tables.USERS, [{ sub: sub }], "tasks", [id]);
};
const updateNewScheduled = async (sub, newScheduled) => {
  await Dynamo.update(Tables.USERS, "sub", { sub, newScheduled });
};

exports.handler = async (event) => {
  const sub = Formatting.getSub(event);
  let user = await Dynamo.get(Tables.USERS, { sub: sub });
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
    await Promise.all(
      taskObjs.map(async (t) => {
        if (
          t.complete &&
          Math.abs(new Date() - new Date(t.completeTime)) /
            (1000 * 60 * 60 * 24) >
            1
        ) {
          await deleteTask(t.id, sub);
        }
        return t;
      })
    );

    taskObjs = taskObjs.filter(
      (t) =>
        !t.complete ||
        Math.abs(new Date() - new Date(t.completeTime)) /
          (1000 * 60 * 60 * 24) <
          1
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
  let scheduled = [];
  if (user.hasOwnProperty("scheduled")) {
    scheduled = user.scheduled;
  }
  let newScheduled = { completed: [], eventually: [] };
  if (user.hasOwnProperty("newScheduled")) {
    let needsToBeUpdated = false;
    newScheduled = user.newScheduled;
    if (newScheduled.completed.length > 0) {
      const newCompletedList = newScheduled.completed.filter(
        (t) =>
          Math.abs(new Date() - new Date(t.completeTime)) /
            (1000 * 60 * 60 * 24) <
          1
      );

      if (newCompletedList.length !== newScheduled.completed.length) {
        //some have been deleted so update list
        needsToBeUpdated = true;
      }
      newScheduled.completed = newCompletedList;
    }
    if (needsToBeUpdated) {
      await updateNewScheduled(sub, newScheduled);
    }
  }
  return Responses._200({
    message: "LETS GOOOO",
    user,
    tasks: taskObjs,
    courses,
    events: eventObjs,
    links,
    scheduled,
    newScheduled,
  });
};
