const formatResponse = require("../common/responseFormatter");
const logger = require("../../common/winston");

function emitError(socket, message) {
  socket.emit("error", formatResponse("error", message));
  logger.info("Emitted 'error' event", `to socketId:${socket.id}, message:${message} `);
}

function emitJWTError(socket, code, message) {
  socket.emit("jwt-error", formatResponse("jwt-error", { code, message }));
  logger.info("Emitted 'jwt-error' event", `to socketId:${socket.id}, code:${code}, message:${message} `);
}

module.exports = {
  emitError,
  emitJWTError,
};
