import { io } from "https://cdn.socket.io/4.5.4/socket.io.esm.min.js";
import * as THREE from "three"; // Import Three.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"; // Import the GLTFLoader

const socket = io("http://192.168.12.14:3000");

let isRoomCreator = false;
let currentTurn = null;
let myId = null;
let myCards = [];

window.onbeforeunload = () => {
  localStorage.removeItem("roomId");
};

function checkWinCondition() {
  if (myCards.length === 0) {
    // If my cards are finished, declare victory
    alert("You have won the game!");
    window.localStorage.removeItem("roomId");
    window.location.href = "/index.html"; // Redirect to start page
  }
}

// Room creation and joining
document.getElementById("create-server").onclick = () => {
  var playerName = document.getElementById('player-name').value;
  socket.emit("createRoom", playerName);
  isRoomCreator = true;
};

document.getElementById("connect-server").onclick = () => {
  const roomId = prompt("Enter room ID:");
  if (roomId != null) {
    var playerName = document.getElementById('player-name').value;
    socket.emit("joinRoom", roomId, playerName);
    isRoomCreator = false;
  }
};

// Setting up the game once started
socket.on("roomCreated", (roomId) => {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("waiting-page").style.display = "block";
  document.getElementById("room-id").innerText = `Room Id: ${roomId}`;
  localStorage.setItem("roomId", roomId);
  if (!isRoomCreator)
    document.getElementById("start-game").style.display = "none";
});

socket.on("playerJoined", (playersList) => {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("waiting-page").style.display = "block";
  document.getElementById(
    "players-list"
  ).innerText = `Players: ${playersList.join(", ")}`;
  if (!isRoomCreator)
    document.getElementById("start-game").style.display = "none";
});

document.getElementById("start-game").onclick = () => {
  const roomId = localStorage.getItem("roomId");
  socket.emit("startGame", roomId);
};

// Game started event handler

socket.on("gameStarted", ({ selectedCardType, players, startingPlayer }) => {
  // document.getElementById("waiting-page").style.display = "none";
  // document.getElementById("game-page").style.display = "block";
  // document.getElementById("selected-card-type").innerText = selectedCardType;
  // document.getElementById("challenge-claim").disabled = true;
  // // Identify player ID and display their cards
  // myId = socket.id;
  // const player = players.find((p) => p.id === myId);
  // myCards = player ? player.cards : [];
  // populateCardSelect(myCards);
  // document.getElementById("myId").innerText = myId;
  // // Set the current turn
  // currentTurn = startingPlayer;
  // updateTurnStatus();
  // Submit claim handler
  // document.getElementById("submit-claim").onclick = () => {
  //   const selectedOptions = Array.from(
  //     document.getElementById("claim-cards").selectedOptions
  //   );
  //   const claimCount = selectedOptions.length;
  //   const claim = `${claimCount} ${
  //     document.getElementById("selected-card-type").innerText
  //   }`;
  //   const selectedCards = selectedOptions.map((option) => option.value);
  //   socket.emit("submitClaim", { claim, selectedCards });
  //   const updateMyCards = new Promise((resolve) => {
  //     selectedCards.forEach((card) => {
  //       const index = myCards.indexOf(card);
  //       console.log(index, card);
  //       if (index !== -1) {
  //         myCards.splice(index, 1);
  //       }
  //     });
  //     resolve();
  //   });
  //   // After promise resolves, call populateCardSelect
  // updateMyCards.then(() => {
  //   populateCardSelect(myCards);
  // });
});

// Claim submitted event handler
socket.on("claimSubmitted", ({ playerId, claim }) => {
  const gameStatus = document.getElementById("game-status");
  gameStatus.innerText += `${playerId} claimed ${claim}.\n`;
});

// document.getElementById("challenge-claim").onclick = () => {
//   socket.emit("challengeClaim");
//   document.getElementById("challenge-claim").disabled = true;
// };

socket.on(
  "nextTurn",
  (nextPlayerId, players, previousPlayerId, previousPlayerClaimed) => {
    currentTurn = nextPlayerId;
    const isMyTurn = currentTurn === myId;

    // Find the previous player
    const previousPlayer = players.find(
      (player) => player.id === previousPlayerId && player.id != myId
    );

    // Enable challenge claim only if previous player has submitted a claim and it’s your turn
    document.getElementById("challenge-claim").disabled =
      !previousPlayer || !previousPlayerClaimed || !isMyTurn;

    updateTurnStatus();

    if (isMyTurn) {
      checkWinCondition();
    }
  }
);

socket.on("playerShot", (playerId) => {
  const gameStatus = document.getElementById("game-status");
  gameStatus.innerText += `${playerId} has been eliminated!\n`;
  if (playerId === myId) {
    window.localStorage.removeItem("roomId");
    alert("You have been eliminated.");
    window.location.href = "/index.html"; // Redirect if the player is eliminated
  } else {
    const roomId = localStorage.getItem("roomId");
    socket.emit("startGame", roomId);
  }
});

// Helper functions for updating UI and selecting cards
// function populateCardSelect(cards) {
//   const claimCards = document.getElementById("claim-cards");
//   claimCards.innerHTML = "";
//   cards.forEach((card, index) => {
//     card
//   });
// }

function updateTurnStatus() {
  const isMyTurn = currentTurn === myId;
  document.getElementById("current-turn").innerText = currentTurn;
  document.getElementById("submit-claim").disabled = !isMyTurn;
}

function initGame(players, currentCartType) {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("waiting-page").style.display = "none";

  var container = document.querySelector(".game-container");

  container.style.display = "block";

  let camera, scene, renderer;
  let core;

  // environment
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    100
  );
  camera.position.set(0, 2, 2);
  camera.rotation.set(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // lights
  const ambient = new THREE.HemisphereLight(0xffffff, 0xbfd4d2, 3);
  scene.add(ambient);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(1, 4, 3).multiplyScalar(3);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.setScalar(2048);
  scene.add(directionalLight);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  var loader = new GLTFLoader();
  // loader.load('./assets/table.glb', (glb) => {
  //   var model = glb.scene;
  //   model.position.set(0, 0, 0)
  //   scene.add(model)
  // })
  const playerPositions = [
    { x: 0, y: -0.5, z: -5, rotation: 0 }, // Bottom position (Player 1)
    { x: 5, y: 1.5, z: -5, rotation: 60 }, // Left position (Player 2)
    { x: 0, y: 3.5, z: -5, rotation: 60 }, // Right position (Player 4)
    { x: -5, y: 1.5, z: -5, rotation: 60 }, // Top position (Player 3)
  ];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredCardIndex = null;
  
  // Function to handle mouse movement
  function onMouseMove(event) {
    // Convert mouse coordinates to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculate objects intersecting the picking ray
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true); // Assuming all cards are added to the scene

    // Reset hovered card index
    hoveredCardIndex = null;

    
    if (intersects.length > 0) {
      // Check if the intersected object is a card
      for (let i = 0; i < intersects.length; i++) {
        const intersectedObject = intersects[i].object;
        console.log(intersectedObject)
        if (intersectedObject.userData.isCard) {
          // Assuming cards have userData.isCard set to true
          hoveredCardIndex = intersectedObject.userData.cardIndex; // Store the index of the hovered card
          onCardHover(hoveredCardIndex); // Call the hover function
          break; // Exit after the first card found
        }
      }
    }

    // Update card positions based on hover state (if needed)
    updateCardPositions();
  }

  // Function to update card positions (optional)
  function updateCardPositions() {
    // You may want to refresh the positions of all cards based on the hovered state
    // This can be done inside the loading loop if necessary
  }

  // Set up event listener for mouse movement
  window.addEventListener("mousemove", onMouseMove, false);

  // When loading each card model, set userData to identify it
  for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
    var player = players[playerIndex];
    var itsMe = player.id == "xhIzCj8YkKjvqZzxAABK";
    const position = itsMe ? playerPositions[0] : playerPositions[playerIndex];
    const cardWidth = itsMe ? 0.4 : 0.25; // Adjust for desired width
    const cardThickness = 0.2; // Adjust for desired height
    const cardHeight = itsMe ? 0.4 : 0.2;

    for (let cardIndex = 0; cardIndex < player.cards.length; cardIndex++) {
      var card = player.cards[cardIndex];

      loader.load(`./assets/${itsMe ? card : currentCartType}.glb`, (glb) => {
        const model = glb.scene;
        // Set user data to identify the card
        model.userData.isCard = true; // Mark it as a card
        model.userData.cardIndex = cardIndex; // Store the index of the card
       
        console.log(model.userData)

        // Set the position of each card (with z offset logic if applicable)
        const zOffset = hoveredCardIndex === cardIndex ? 0.2 : 0; // Adjust the z offset when hovered
        model.position.set(
          position.x,
          position.y,
          position.z - cardIndex * cardHeight + zOffset // Apply z offset for hovered card
        );

        var angelY = 60;

        const angle = Math.PI / 2; // 90 degrees in radians
        model.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), angle);
        model.rotation.set(
          model.rotation.x,
          THREE.MathUtils.degToRad(angelY - (30 * cardIndex)),
          model.rotation.z + position.rotation
        );
        model.scale.set(cardWidth, cardThickness, cardHeight);

        // Rest of your card setup code...
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
}
