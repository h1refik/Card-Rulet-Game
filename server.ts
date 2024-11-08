import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { Player, Room } from './model.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());

let rooms: Room[] = [];


io.on("connection", (socket: Socket) => {
  socket.on("createRoom", async (playerName: string) => {
    const newRoom = new Room();

    const newPlayer = new Player(socket.id, playerName, true);
    newRoom.chairs.filter(p => !p.player)[0].sit(newPlayer);
    newRoom.currentTurn = newPlayer;
    rooms.push(newRoom);
    await socket.join(newRoom.id);
    io.to(newRoom.id).emit(
      "playerJoined",
      newRoom.chairs.filter(p => p.player).flatMap(p => { return p.player })
    );
    socket.emit("roomCreated", newRoom.id);
  });

  // Event for joining an existing room
  socket.on("joinRoom", (roomId: string, playerName: string) => {
    var room = rooms.find((room) => room.id === roomId);
    var players = room!.chairs.filter(p => p.player).flatMap(p => p.player);
    if (room && !room.gameStarted && players.length < 4) {
      const newPlayer = new Player(socket.id, playerName, true);
      room.chairs.filter(p => !p.player)[0].sit(newPlayer);
      players.push(newPlayer)
      socket.join(roomId);
      io.to(roomId).emit(
        "playerJoined",
        players
      );
    } else {
      socket.emit("invalidRoom");
    }
  });

  // Event to start the game in the room
  socket.on("startGame", (roomId: string) => {
    const room = rooms.find((room) => room.id == roomId);
    var players = room!.chairs.filter(p => p.player).flatMap(p => p.player);
    if (room) {
      if (players.length >= 4) {
        room.currentTurn = players[0]!;
        room.gameStarted = true;
        io.to(roomId).emit("gameStarted", room.selectedCardType, players, room.currentTurn);
      }
    }
  });

  // socket.on("submitClaim", ({ claim, selectedCards }) => {
  //   const room = rooms.find((room) =>
  //     room.players.some((player) => player.id === socket.id)
  //   );
  //   if (room) {
  //     room.claims.push({ playerId: socket.id, claim, cards: selectedCards });
  //     io.to(room.roomId).emit("claimSubmitted", {
  //       playerId: socket.id,
  //       claim,
  //     });

  //     // Remove selected cards from the player's hand
  //     const player = room.players.find((p) => p.id === socket.id);
  //     if (player) {
  //       player.hasClaimed = true; // Mark the player as having made a claim
  //       selectedCards.forEach((card) => {
  //         const index = player.cards.indexOf(card);
  //         if (index !== -1) {
  //           player.cards.splice(index, 1);
  //         }
  //       });
  //     }

  //     advanceTurn(room);
  //   }
  // });

  // Event for challenging a claim
  // socket.on("challengeClaim", () => {
  //   const room = rooms.find((room) =>
  //     room.players.some((player) => player.id === socket.id)
  //   );
  //   if (room) {
  //     const lastClaim = room.claims[room.claims.length - 1];
  //     const correct = lastClaim.cards.every(
  //       (card) => card.includes(room.selectedCardType) || card.includes("Joker")
  //     );

  //     const eliminatedId = correct ? socket.id : lastClaim.playerId;
  //     room.players = room.players.filter((player: Player) => player.id !== eliminatedId);
  //     const eliminatedPlayer = room.players.find((player: Player) => player.id == eliminatedId);
  //     io.to(room.roomId).emit("playerShot", eliminatedPlayer);

  //     if (room.players.length > 1) {
  //       advanceTurn(room);
  //     } else {
  //       io.to(room.roomId).emit("gameEnded", room.players[0].id);
  //     }
  //   }
  // });

  // function shuffleCards(selectedCardType, minCount = 4) {
  //   // Define the full deck with a mix of all card types
  //   const fullDeck = [
  //     ...Array(6).fill("Ace"),
  //     ...Array(6).fill("Queen"),
  //     ...Array(6).fill("King"),
  //     ...Array(2).fill("Joker"),
  //   ];

  //   // Ensure the minimum count of the selected card type in the deck
  //   const selectedCards = Array(minCount).fill(selectedCardType);
  //   const remainingDeck = fullDeck.filter((card) => card !== selectedCardType);

  //   // Shuffle the remaining deck
  //   const shuffledDeck = remainingDeck.sort(() => Math.random() - 0.5);

  //   // Combine the selected cards with the shuffled remaining deck
  //   const deck = [...selectedCards, ...shuffledDeck].sort(
  //     () => Math.random() - 0.5
  //   );

  //   return deck;
  // }

  // Utility function to deal cards to players
  // function dealCardsToPlayers(room) {
  //   room.players.forEach((player) => {
  //     player.cards = room.cards.splice(0, 5); // Give 5 cards to each player
  //   });
  // }

  // Utility function to advance the turn
  // function advanceTurn(room) {
  //   const alivePlayers = room.players.filter((player) => player.alive);
  //   const currentPlayerIndex = alivePlayers.findIndex(
  //     (player) => player.id === room.currentTurn
  //   );
  //   room.previousPlayer =
  //     alivePlayers[currentPlayerIndex % alivePlayers.length];
  //   room.currentTurn =
  //     alivePlayers[(currentPlayerIndex + 1) % alivePlayers.length].id;

  //   // Notify players of the next turn and the previous player's claim status
  //   io.to(room.roomId).emit(
  //     "nextTurn",
  //     room.currentTurn,
  //     alivePlayers,
  //     room.previousPlayer,
  //     room.players.find((player) => player.id === room.previousPlayer)
  //       ?.hasClaimed // Pass previous player's claim status
  //   );
  // }

  // Disconnect event
  socket.on("disconnect", () => {
    rooms = rooms.map((room) => ({
      ...room,
      players: room!.chairs.flatMap(p => p.player).filter((player) => player?.id != socket.id),
    }));
    rooms = rooms.filter((room) => room!.chairs.flatMap(p => p.player).length > 0);
  });
});

server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
