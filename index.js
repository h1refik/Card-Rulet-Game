var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const socket = io("http://localhost:3000");
let isRoomCreator = false;
let currentTurn;
let myCards = [];
let mainMenuSection = document.getElementById('main-menu');
let waitingPageSection = document.getElementById('waiting-page');
let roomIdSection = document.getElementById('room-id');
let startGameBtn = document.getElementById("start-game");
let playersListSection = document.getElementById("players-list");
let gameStatus = document.getElementById("game-status");
const cards = ['King', 'Queen', 'Ace', 'Joker'];
window.onbeforeunload = () => {
    localStorage.removeItem("roomId");
};
function checkWinCondition() {
    if (myCards.length === 0) {
        alert("You have won the game!");
        window.localStorage.removeItem("roomId");
        window.location.href = "/index.html";
    }
}
(_a = document.getElementById("create-server")) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
    var playerInput = document.getElementById("player-name");
    socket.emit("createRoom", playerInput.value);
    isRoomCreator = true;
});
(_b = document.getElementById("connect-server")) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
    const roomId = prompt("Enter room ID:");
    if (roomId != null) {
        var playerInput = document.getElementById("player-name");
        socket.emit("joinRoom", roomId, playerInput.value);
        isRoomCreator = false;
    }
});
socket.on("roomCreated", (roomId) => {
    mainMenuSection.style.display = "none";
    waitingPageSection.style.display = "block";
    roomIdSection.innerText = `Room Id: ${roomId}`;
    localStorage.setItem("roomId", roomId);
    if (!isRoomCreator)
        startGameBtn.style.display = "none";
});
socket.on("playerJoined", (playersList) => {
    const playerNames = playersList.map(p => p.name);
    mainMenuSection.style.display = "none";
    waitingPageSection.style.display = "block";
    if (playersList.length >= 4) {
        startGameBtn.classList.remove("disabled");
    }
    playersListSection.innerText = `Players: ${playerNames.join(", ")}`;
    if (!isRoomCreator)
        startGameBtn.style.display = "none";
});
startGameBtn.onclick = () => {
    const roomId = localStorage.getItem("roomId");
    socket.emit("startGame", roomId);
};
socket.on("gameStarted", (selectedCardType, players, currentTun) => {
    let playersSorted = players;
    const currentPlayerIndex = playersSorted.findIndex(player => player.id === socket.id);
    const [currentPlayer] = playersSorted.splice(currentPlayerIndex, 1);
    playersSorted.unshift(currentPlayer);
    initGame(playersSorted, selectedCardType);
});
// socket.on("claimSubmitted", (playerId: string, claim) => {
//   gameStatus.innerText += `${playerId} claimed ${claim}.\n`;
// });
socket.on("nextTurn", (currentTurn, players, previousPlayer) => {
    currentTurn = currentTurn;
    const isMyTurn = currentTurn.id === socket.id;
    const getPreviousPlayer = players.find((player) => player.id === previousPlayer.id && player.id != socket.id);
    // document.getElementById("challenge-claim").disabled =
    //   !getPreviousPlayer || !previousPlayerClaimed || !isMyTurn;
    updateTurnStatus();
    if (isMyTurn) {
        checkWinCondition();
    }
});
socket.on("playerShot", (player) => {
    gameStatus.innerText += `${player.name} has been eliminated!\n`;
    if (player.id === socket.id) {
        window.localStorage.removeItem("roomId");
        alert("You have been eliminated.");
        window.location.href = "/index.html";
    }
    else {
        const roomId = localStorage.getItem("roomId");
        socket.emit("startGame", roomId);
    }
});
function updateTurnStatus() {
    const isMyTurn = currentTurn.id === socket.id;
    // document.getElementById("current-turn").innerText = currentTurn.id;
    // document.getElementById("submit-claim").disabled = !isMyTurn;
}
initGame([
    { "hand": [{ "suit": 2 }, { "suit": 2 }, { "suit": 2 }, { "suit": 1 }, { "suit": 2 }], "alive": true, "id": "rPy9xr_Hs24pJXX2AAAE", "name": "Mehmet" },
    { "hand": [{ "suit": 1 }, { "suit": 3 }, { "suit": 1 }, { "suit": 1 }, { "suit": 0 }], "alive": true, "id": "SaYwX9sIWISFq4aKAAAF", "name": "Ahmet" },
    { "hand": [{ "suit": 0 }, { "suit": 3 }, { "suit": 1 }, { "suit": 1 }, { "suit": 1 }], "alive": true, "id": "_KuOdB3YQPO3Yb8GAAAH", "name": "Muhammed" },
    { "hand": [{ "suit": 0 }, { "suit": 1 }, { "suit": 2 }, { "suit": 1 }, { "suit": 1 }], "alive": true, "id": "w-8B2Q5FOpGjXKo0AAAG", "name": "Taha" }
], { suit: 2 });
function initGame(players, currentCartType) {
    return __awaiter(this, void 0, void 0, function* () {
        mainMenuSection.style.display = "none";
        waitingPageSection.style.display = "none";
        var container = document.querySelector(".game-container");
        container.style.display = "block";
        let camera, scene, renderer;
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100);
        camera.position.set(0, 2, 2);
        camera.rotation.set(0, 0, 0);
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        const ambient = new THREE.HemisphereLight(0xffffff, 0xbfd4d2, 3);
        scene.add(ambient);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(1, 4, 3).multiplyScalar(3);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.setScalar(2048);
        scene.add(directionalLight);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animate);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        var loader = new GLTFLoader();
        const playerPositions = [
            { x: 0, y: -0.5, z: -5 }, // Bottom position (Player 1)
            { x: 5, y: 1.5, z: -5 }, // Left position (Player 2)
            { x: 0, y: 3.5, z: -5 }, // Right position (Player 4)
            { x: -5, y: 1.5, z: -5 }, // Top position (Player 3)
        ];
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredCardIndex;
        function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            hoveredCardIndex = 0;
            if (intersects.length > 0) {
                for (let i = 0; i < intersects.length; i++) {
                    const intersectedObject = intersects[i].object;
                    if (intersectedObject.userData.isCard) {
                        hoveredCardIndex = intersectedObject.userData.cardIndex;
                        //CardHover
                        break;
                    }
                }
            }
            updateCardPositions();
        }
        function updateCardPositions() { }
        window.addEventListener("mousemove", onMouseMove, false);
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
            var player = players[playerIndex];
            var itsMe = player.id == "rPy9xr_Hs24pJXX2AAAE";
            const position = itsMe ? playerPositions[0] : playerPositions[playerIndex];
            const cardWidth = itsMe ? 0.4 : 0.3;
            const cardThickness = 0.2;
            const cardHeight = itsMe ? 0.4 : 0.3;
            for (let cardIndex = 0; cardIndex < player.hand.length; cardIndex++) {
                var card = player.hand[cardIndex];
                const cardType = itsMe ? cards[card.suit] : cards[currentCartType.suit];
                yield loader.load(`./assets/${cardType}.glb`, (glb) => {
                    var model = glb.scene;
                    model.userData.isCard = true;
                    model.userData.cardIndex = cardIndex;
                    console.log(cardIndex);
                    const zOffset = hoveredCardIndex === cardIndex ? 0.2 : 0;
                    model.position.set(position.x, position.y, position.z - cardIndex * cardHeight + zOffset);
                    const angle = Math.PI / 2;
                    model.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), angle);
                    // Set the rotation of the card based on player positions
                    let cardRotation = 0;
                    let cardRotationY = 0;
                    if (playerIndex === 0) { // Player 1
                        cardRotation = 0; // Face to Player 3
                        cardRotationY = 40; // Face to Player 3
                    }
                    else if (playerIndex === 1) { // Player 2
                        cardRotation = -90; // Face to Player 4
                        cardRotationY = 30;
                    }
                    else if (playerIndex === 2) { // Player 3
                        cardRotation = 180; // Face to Player 1
                        cardRotationY = 60;
                    }
                    else if (playerIndex === 3) { // Player 4
                        cardRotation = 90; // Face to Player 4
                        cardRotationY = 10;
                    }
                    model.rotation.set((model.rotation.x), (THREE.MathUtils.degToRad(cardRotationY - (10 * cardIndex))), (THREE.MathUtils.degToRad(cardRotation - (cardIndex))));
                    model.scale.set(cardWidth, cardThickness, cardHeight);
                    scene.add(model);
                });
            }
        }
        window.addEventListener("resize", onWindowResize);
        onWindowResize();
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        function animate() {
            renderer.render(scene, camera);
        }
    });
}
