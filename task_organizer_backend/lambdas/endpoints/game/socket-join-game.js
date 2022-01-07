const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const SocketConstants = require("../../common/SocketConstants");
const Tables = require("../../common/TableConstants");
const { SOCKET_UPDATE_GAME } = require("../../common/SocketConstants");
exports.handler = async (event) => {
  //id
  const eventData = Formatting.ensureObject(event.body).data;
  const gameId = eventData.id;
  const connectionId = event.requestContext.connectionId;
  const callingSub = await Database.getSubFromConnection(connectionId);
  const user = await Dynamo.get(Tables.USERS, { sub: callingSub });
  const game = await Dynamo.get(Tables.GAMES, { id: gameId });
  let newGame = {};
  if (game === null || game === undefined) {
    //create new game
    newGame = {
      id: gameId,
      lastMove: null,
      isFinished: false,
      timeCreated: new Date().toISOString(),
      winner: "",
      players: [{ sub: callingSub, username: user.username }],
      board: Array(81).fill("_"),
      currentTurn: null,
    };
    await Dynamo.put(Tables.GAMES, newGame);
    await Socket.sendToAllConnections(
      SOCKET_UPDATE_GAME,
      newGame,
      connectionId
    );
    await Dynamo.list_add(Tables.USERS, [{ sub: callingSub }], "games", [
      gameId,
    ]);
  } else if (game.players.some((p) => p.sub === callingSub)) {
    //load game
    newGame = game;
  } else if (game.players.length === 1) {
    //start game
    const player1isX = Math.random() < 0.5;
    const p1 = player1isX ? "X" : "O";
    const p2 = player1isX ? "O" : "X";
    newGame = {
      ...game,
      currentTurn: "X",
      players: [
        { ...game.players[0], piece: p1 },
        { sub: callingSub, username: user.username, piece: p2 },
      ],
    };
    await Dynamo.put(Tables.GAMES, newGame);
    await Socket.sendToAllConnections(
      SOCKET_UPDATE_GAME,
      newGame,
      connectionId
    );
    await Dynamo.list_add(Tables.USERS, [{ sub: callingSub }], "games", [
      gameId,
    ]);
  } else {
    //join as spectator
    newGame = game;
  }

  const resp = newGame;
  return Responses._200_socket(SOCKET_UPDATE_GAME, resp);
};
