const Responses = require("../../common/API_Responses");
const Formatting = require("../../common/Formatting");
const Dynamo = require("../../common/dynamo");
const Socket = require("../../common/socket");
const Database = require("../../common/CommonDatabaseCalls");
const SocketConstants = require("../../common/SocketConstants");
const Tables = require("../../common/TableConstants");

const updatePlayerLeaderboards = async (winner, loser) => {
  console.log("SENDING TO DATABSE", winner, loser);
  const winnerWins = (await Dynamo.get(Tables.USERS, { sub: winner })).wins;
  const loserLosses = (await Dynamo.get(Tables.USERS, { sub: loser })).losses;
  console.log("WINS", winnerWins, "LOSSES", loserLosses);
  await Dynamo.update(Tables.USERS, "sub", {
    sub: winner,
    wins: winnerWins + 1,
  });
  await Dynamo.update(Tables.USERS, "sub", {
    sub: loser,
    losses: loserLosses + 1,
  });
};

exports.handler = async (event) => {
  //id, position, isFinished
  const eventData = Formatting.ensureObject(event.body).data;
  const gameId = eventData.id;
  const connectionId = event.requestContext.connectionId;
  const callingSub = await Database.getSubFromConnection(connectionId);
  const game = await Dynamo.get(Tables.GAMES, { id: gameId });
  let newGame = {};
  if (
    (game.players[0].sub === callingSub &&
      game.players[0].piece === game.currentTurn) ||
    (game.players[1].sub === callingSub &&
      game.players[1].piece === game.currentTurn)
  ) {
    const newBoard = game.board;
    newBoard[eventData.position] = game.currentTurn;
    newGame = {
      ...game,
      board: newBoard,
      lastMove: {
        time: new Date().toISOString(),
        position: eventData.position,
      },
      isFinished: eventData.isFinished,
      winner: eventData.isFinished ? callingSub : null,
      currentTurn: game.currentTurn === "X" ? "O" : "X",
    };
    await Dynamo.put(Tables.GAMES, newGame);
    await Socket.sendToAllConnections(
      SocketConstants.SOCKET_UPDATE_GAME,
      newGame,
      connectionId
    );
    if (eventData.isFinished) {
      await updatePlayerLeaderboards(
        callingSub,
        game.players.find((p) => p.sub != callingSub).sub
      );
    }
  } else {
    return Responses._400("No currect turn or invalid id");
  }

  const resp = newGame;
  return Responses._200_socket(SocketConstants.SOCKET_UPDATE_GAME, resp);
};
