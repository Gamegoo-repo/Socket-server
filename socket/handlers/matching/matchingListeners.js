const { fetchMatching } = require("../../apis/matchApi");
const { updateOtherPriorityTrees, updatePriorityTree, handleSocketError, joinGameModeRoom, findMatching, deleteSocketFromMatching } = require("./matchingHandler/matchingStartedHandler");
const { emitError } = require("../../emitters/errorEmitter");

/**
 * Matching socket event 관련 리스너
 * @param {*} socket 
 * @param {*} io 
 */
async function setupMatchListeners(socket, io) {
  socket.on("matching_started", async (request) => {
    const gameMode = request.gameMode;
    const roomName = "GAMEMODE_" + gameMode;

    // socket.id가 소켓 룸 "GAMEMODE_" + gameMode에 있는지 확인
    const usersInRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
    console.log(usersInRoom);
    if (usersInRoom.has(socket.id)) {
      console.log("ERROR : 이미 매칭을 시도한 소켓입니다.");
      emitError(socket, "You are already in the matching room for this game mode.");
      return;
    }

    // 게임 모드에 따라 소켓룸에 조인
    joinGameModeRoom(socket, io, roomName);

    try {
      const result = await fetchMatching(socket, request);

      // 내 우선순위 트리 갱신
      updatePriorityTree(socket, result.myPriorityList);

      // 다른 사람 우선순위 트리 갱신
      await updateOtherPriorityTrees(io, socket, result.otherPriorityList);

      // priorityTree의 maxNode가 55를 넘는지 확인
      // TODO: 소켓 id를 리턴 받아서 여기에서 matching_found 를 
      const otherSocket = await findMatching(socket, io, 55);
      if (otherSocket) {
        // TODO: matching_found emit 보내기 (나 & 상대방 둘 다 보내야함)
        // deleteSocketFromMatching(socket, io,otherSocket, roomName);
        console.log("Matching Found");
      } else {
        // 우선순위 값이 55 이상인 매칭을 못찾았을 경우
        // 2분 후에 findMatching을 다시 실행
        setTimeout(async () => {
          if (await findMatching(socket, io, 50)) {
            // TODO: matching_found emit 보내기 (나 & 상대방 둘 다 보내야함)
            // deleteSocketFromMatching(socket, io, otherSocket, roomName);
            console.log("Matching Found and Deleted");
          }
        }, 2 * 60 * 1000); // 2분 = 120,000ms
      }
    } catch (error) {
      handleSocketError(socket, error);
    }

  });

  socket.on("matching_found", handleMatchingFound);
  socket.on("matching_success", handleMatchingSuccess);
  socket.on("matching_failed", handleMatchingFailed);
}



function handleMatchingFound(request) {
  console.log("matching_found", request);
}

function handleMatchingSuccess(request) {
  console.log(request);
}

function handleMatchingFailed(request) {
  console.log(request);
}

module.exports = { setupMatchListeners };
