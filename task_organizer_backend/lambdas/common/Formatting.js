const Responses = {
  ensureObject(data = "") {
    return typeof data === "string" ? JSON.parse(data) : data;
  },
  getSub(event) {
    return event.requestContext.authorizer.claims.sub;
  },
};

module.exports = Responses;
