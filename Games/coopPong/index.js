import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getDatabase, ref, set, onValue, onDisconnect, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"

const firebaseConfig = {
    apiKey: "AIzaSyCl9Pg1dTjgtgcnYAgQj9AXhYu84XKEKpA",
    authDomain: "bartkor12-site.firebaseapp.com",
    databaseURL: "https://bartkor12-site-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bartkor12-site",
    storageBucket: "bartkor12-site.appspot.com",
    messagingSenderId: "180406251809",
    appId: "1:180406251809:web:a0dca5ecf53a511e294e60",
    measurementId: "G-WY7H8ZD85E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase()

//variables
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const matchmaking = document.getElementById("matchmaking")
const container = document.getElementById("container")
const maxPlayers = 2

onAuthStateChanged(auth, user => {
    if (user) {

        const plr = auth.currentUser.uid
        const gamesRef = ref(database, "public/ongoingGames/pong")
        const gameRef = ref(database, "public/ongoingGames/pong/" + plr)

        const paddleHeight = 80;
        const paddleWidth = 10;
        const ballRadius = 10;

        let ballX = canvas.width / 2;
        let ballY = canvas.height / 2;

        let player1Y = (canvas.height - paddleHeight) / 2;
        let player2Y = (canvas.height - paddleHeight) / 2;
        let currentPlayer = 1; // Variable to determine which player can control which paddle

        matchmaking.style.display = "flex"
        document.getElementById("signinmessage").remove()

        function handleMultiplayer(gameref) {

            const base = "public/ongoingGames/pong/" + gameref.key
            const playersRef = ref(database, base + "/players")
            const ready = ref(database, base + "/players/plr" + currentPlayer + "/ready")
            const yRef = ref(database, base + "/players/plr" + currentPlayer + "/y")
            const otherPlayer = currentPlayer === 1 ? 2 : 1
            const otherPlayerYRef = ref(database, base + "/players/plr" + otherPlayer + "/y")
            const otherPlayerReadyRef = ref(database, base + "/players/plr" + otherPlayer + "/ready")
            const ballRef = ref(database, base + "/ball")
            const ballXRef = ref(database, base + "/ball/X")
            const ballYRef = ref(database, base + "/ball/Y")

            // let interval = setInterval(() => {
            //     if (currentPlayer == 1) {
            //         set(yRef, player1Y)
            //     }
            //     if (currentPlayer == 2) {
            //         set(yRef, player2Y)
            //     }
            // }, 10);

            onDisconnect(gameref).remove(() => {
                //stops it spamming the yref
                // clearInterval(interval)
            })

            //when the other player moves up or down set their current Y value in game
            onValue(otherPlayerYRef, snapshot => {
                const data = snapshot.val()

                if (otherPlayer === 1) {
                    player1Y = data
                }
                if (otherPlayer === 2) {
                    player2Y = data
                }
            })

            let currentPlayerReady

            onValue(playersRef, (snapshot) => {
                const players = snapshot.val()
                if (!players) { location.reload() }

                // if 2 players are in the game, start it and make the canvas visible
                if (canvas.style.display != "flex" && Object.keys(players).length == maxPlayers) {

                    canvas.style.display = "flex"
                    matchmaking.remove()
                    document.getElementById("canvasContainer").style.display = "block"
                    document.getElementById("name1").textContent = players.plr1.name + " score : "
                    document.getElementById("name2").textContent = players.plr2.name + " score : "
                    //delay to make sure the player has loaded in
                    setTimeout(() => {
                        set(ready, true)
                        currentPlayerReady = true
                    }, 1000);
                    // setInterval(interval)

                } else if (canvas.style.display == "flex" && Object.keys(players).length != maxPlayers) {

                    location.reload()
                }
            })

            // wait for condition to turn true
            function waitFor(conditionFunction) {

                const poll = resolve => {
                    if (conditionFunction()) resolve();
                    else setTimeout(_ => poll(resolve), 400);
                }

                return new Promise(poll);
            }

            // trigger once the other players ready value has changed
            onValue(otherPlayerReadyRef, async (snapshot) => {
                const otherPlayerReady = snapshot.val()

                console.log("A")
                await waitFor(_ => currentPlayerReady === true)
                await waitFor(_ => otherPlayerReady === true)

                //calls when both players are ready, starts game
                console.log("B")
                // i'll be honest I used AI to generate the code below this comment as a test for multiplayer

                //GAME CODE

                let dx = 2;
                let dy = -2;

                let player1UpPressed = false;
                let player1DownPressed = false;
                let player2UpPressed = false;
                let player2DownPressed = false;

                let player1Score = 0;
                let player2Score = 0;


                function drawPaddle(y1, y2) {
                    ctx.fillStyle = '#000'; // Set fill style for paddles
                    ctx.fillRect(0, y1, paddleWidth, paddleHeight); // Draw paddle for player 1
                    ctx.fillRect(canvas.width - paddleWidth, y2, paddleWidth, paddleHeight); // Draw paddle for player 2
                }

                function drawBall() {
                    ctx.beginPath();
                    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
                    ctx.fillStyle = '#0095DD';
                    ctx.fill();
                    ctx.closePath();
                }

                function drawScores() {
                    let player1Text = document.getElementById("name1").textContent;
                    let player2Text = document.getElementById("name2").textContent;

                    // Extract the player names
                    let playerName1 = player1Text.substring(0, player1Text.indexOf(':') + 1);
                    let playerName2 = player2Text.substring(0, player2Text.indexOf(':') + 1);

                    // Update only the score values
                    document.getElementById("name1").textContent = playerName1 + " " + player1Score;
                    document.getElementById("name2").textContent = playerName2 + " " + player2Score;
                }

                function updatePaddlePositions() {

                    if (currentPlayer === 1) {
                        if (player1UpPressed && player1Y > 0) {
                            player1Y -= 5;
                        }
                        if (player1DownPressed && player1Y < canvas.height - paddleHeight) {
                            player1Y += 5;
                        }
                        set(yRef, player1Y)
                    } else if (currentPlayer === 2) {
                        if (player2UpPressed && player2Y > 0) {
                            player2Y -= 5;
                        }
                        if (player2DownPressed && player2Y < canvas.height - paddleHeight) {
                            player2Y += 5;
                        }
                        set(yRef, player2Y)
                    }
                }

                function updateScores() {
                    // Check if the ball went past the paddles
                    if (ballX - ballRadius <= 0) {
                        player2Score++; // Player 2 scored
                        resetBall();
                    } else if (ballX + ballRadius >= canvas.width) {
                        player1Score++; // Player 1 scored
                        resetBall();
                    }
                }

                function resetBall() {
                    ballX = canvas.width / 2;
                    ballY = canvas.height / 2;
                    dx = -dx; // Change ball direction

                    //reset
                    dx = Math.sign(dx) === -1 ? -2 : 2
                }

                let limit = 10

                function draw() {
                    // Draw trail effect by filling canvas with transparent color
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw paddles and ball
                    drawPaddle(player1Y, player2Y);
                    drawBall();
                    drawScores(); // Draw scores

                    // Bounce the ball off the walls
                    if (ballY + dy > canvas.height - ballRadius || ballY + dy < ballRadius) {
                        dy = -dy;
                    }

                    // Bounce the ball off the paddles
                    if (
                        (ballX - ballRadius <= paddleWidth && ballY >= player1Y && ballY <= player1Y + paddleHeight) ||
                        (ballX + ballRadius >= canvas.width - paddleWidth && ballY >= player2Y && ballY <= player2Y + paddleHeight)
                    ) {
                        dx = -dx;
                        // adds speed to the ball
                        let newdx = (dx + Math.sign(dx))

                        // clamping the value to be between -5 and 5
                        if (newdx < -6) {
                            newdx = -6;
                        } else if (newdx > 6) {
                            newdx = 6;
                        }

                        dx = newdx
                    }

                    // Update ball position

                    if (currentPlayer == 1) {
                        if (limit > 0) {
                            limit -= 1
                            // ballX += dx;
                            // ballY += dy;
                            set(ballXRef, ballX + dx)
                            set(ballYRef, ballY + dy)
                        } else {
                            limit = 10
                        }
                    }

                    // onvalue function for players is below

                    // Update paddle positions
                    updatePaddlePositions();

                    // Update scores
                    updateScores();
                }

                onValue(ballRef, snapshot => {
                    const data = snapshot.val()

                    if (data) {
                        ballX = data.X
                        ballY = data.Y
                    }
                })

                document.addEventListener('keydown', function (e) {
                    if (e.key === 'w') {
                        if (currentPlayer === 1) {
                            player1UpPressed = true;
                        } else if (currentPlayer === 2) {
                            player2UpPressed = true;
                        }
                    } else if (e.key === 's') {
                        if (currentPlayer === 1) {
                            player1DownPressed = true;
                        } else if (currentPlayer === 2) {
                            player2DownPressed = true;
                        }
                    }
                });

                document.addEventListener('keyup', function (e) {
                    if (e.key === 'w') {
                        if (currentPlayer === 1) {
                            player1UpPressed = false;
                        } else if (currentPlayer === 2) {
                            player2UpPressed = false;
                        }
                    } else if (e.key === 's') {
                        if (currentPlayer === 1) {
                            player1DownPressed = false;
                        } else if (currentPlayer === 2) {
                            player2DownPressed = false;
                        }
                    }
                });

                setInterval(draw, 10);
            })
        }

        // once player starts matchmaking, run this
        matchmaking.addEventListener("submit", (e) => {
            e.preventDefault()
            matchmaking.innerHTML = "<h1 style=\"text-align:center;\">Searching for a match...<br><br> Invite another friend over to play</h1>"

            get(gamesRef).then((snapshot) => {
                const data = snapshot.val()

                if (data != null) {

                    let currentGame = null

                    // loops through snapshot data to find a game to join
                    snapshot.forEach(gameData => {
                        const playersInGame = Object.keys(gameData.val()).length

                        if (playersInGame < maxPlayers) {
                            currentGame = gameData
                            return true
                        }
                    });

                    const newPlayers = currentGame.val()
                    newPlayers.players.plr2 = {
                        y: 0,
                        name: auth.currentUser.displayName,
                        ready: false
                    }

                    // players added
                    const currentGameRef = ref(database, "public/ongoingGames/pong/" + currentGame.key)
                    set(currentGameRef, newPlayers)

                    currentPlayer = 2
                    handleMultiplayer(currentGameRef)
                }
                else {
                    // no game made yet
                    set(gameRef, {
                        players: {
                            plr1: {
                                y: 0,
                                name: auth.currentUser.displayName,
                                ready: false
                            }
                        }
                    })
                    currentPlayer = 1
                    handleMultiplayer(gameRef)
                }
            })
        })
    } else {
        //nothing here yet
    }
})