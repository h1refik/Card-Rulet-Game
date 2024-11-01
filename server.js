"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;
app.use(cors());
let rooms = [];
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Event for creating a new room
    socket.on("createRoom", (playerName) => __awaiter(void 0, void 0, void 0, function* () {
        const newRoom = new model_1.Room();
        const newPlayer = new model_1.Player(socket.id, playerName, true);
        newRoom.chairs.filter(p => !p.player)[0].sit(newPlayer);
        newRoom.currentTurn = newPlayer;
        rooms.push(newRoom);
        yield socket.join(newRoom.id);
        io.to(newRoom.id).emit("playerJoined", newRoom.chairs.flatMap(p => { return p.player; }).filter(p => p != undefined).map((player) => player.name));
        socket.emit("roomCreated", newRoom.id);
    }));
    // Event for joining an existing room
    socket.on("joinRoom", (roomId, playerName) => {
        var room = rooms.find((room) => room.id === roomId);
        var players = room.chairs.filter(p => p.player).flatMap(p => p.player);
        if (room && !room.gameStarted && players.length < 4) {
            const newPlayer = new model_1.Player(socket.id, playerName, true);
            room.chairs.filter(p => !p.player)[0].sit(newPlayer);
            players.push(newPlayer);
            socket.join(roomId);
            io.to(roomId).emit("playerJoined", players.map((player) => player.name));
        }
        else {
            socket.emit("invalidRoom");
        }
    });
    // Event to start the game in the room
    socket.on("startGame", (roomId) => {
        const room = rooms.find((room) => room.id === roomId);
        var players = room.chairs.flatMap(p => p.player);
        if (room) {
            if (players.length >= 2) {
                room.currentTurn = players[0];
                room.gameStarted = true;
                io.to(roomId).emit("gameStarted", {
                    selectedCardType: room.selectedCardType,
                    players: players,
                    startingPlayer: room.currentTurn,
                });
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
    //         console.log(index, card);
    //         if (index !== -1) {
    //           player.cards.splice(index, 1);
    //         }
    //         console.log(player.cards);
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
    //     console.log(lastClaim.cards);
    //     const loserId = correct ? socket.id : lastClaim.playerId;
    //     room.players = room.players.filter((player) => player.id !== loserId);
    //     io.to(room.roomId).emit("playerShot", loserId);
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
    //   room.previousPlayerId =
    //     alivePlayers[currentPlayerIndex % alivePlayers.length]?.id;
    //   room.currentTurn =
    //     alivePlayers[(currentPlayerIndex + 1) % alivePlayers.length].id;
    //   // Notify players of the next turn and the previous player's claim status
    //   io.to(room.roomId).emit(
    //     "nextTurn",
    //     room.currentTurn,
    //     alivePlayers,
    //     room.previousPlayerId,
    //     room.players.find((player) => player.id === room.previousPlayerId)
    //       ?.hasClaimed // Pass previous player's claim status
    //   );
    // }
    // Disconnect event
    socket.on("disconnect", () => {
        rooms = rooms.map((room) => (Object.assign(Object.assign({}, room), { players: room.chairs.flatMap(p => p.player).filter((player) => (player === null || player === void 0 ? void 0 : player.id) != socket.id) })));
        rooms = rooms.filter((room) => room.chairs.flatMap(p => p.player).length > 0);
        console.log(`User disconnected: ${socket.id}`);
    });
});
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
