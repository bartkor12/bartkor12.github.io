import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFirestore, addDoc, getDoc, setDoc, collection, serverTimestamp, onSnapshot, query, where, doc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const firestore = getFirestore(app);

firestore.SnapshotOptions

//variables
const loginRedirect = document.getElementById("loginRedirect");
const profileDropdown = document.createElement("button");
const name = document.createElement("h1");
const dropdownContent = document.getElementById("dropdownContent");
const signOutButton = document.getElementById("signOutButton");

signOutButton.addEventListener("mousedown", () => {
    signOut(auth)
        .then(() => {
            console.log("sign out successful");
            location.reload();
        })
        .catch((error) => {
            console.log("sign out failed: " + error);
        });
});

profileDropdown.appendChild(name);
profileDropdown.className = "login_icon newIcon";
name.className = "fancyText"

const chat = document.getElementById("chat");
const sendMessageButton = document.getElementById("sendMessage");
const mainChat = document.getElementById("mainChat");
const newChatroom = document.getElementById("newChatroom")
const chats = document.getElementById("chats");

function createMessage(e) {

    const existingMessage = document.getElementById(`message-${e.id}`);
    if (existingMessage) {
        return; // Exit function if message already exists
    }

    const messageDiv = document.createElement("div")
    messageDiv.className = "message"
    messageDiv.id = `message-${e.id}`

    const messageInfoDiv = document.createElement("div")
    messageInfoDiv.className = "messageInfo"

    const profilePicture = document.createElement("img")

    const messageContentDiv = document.createElement("div")
    messageContentDiv.classList = "messageContent"

    const usernameAndDate = document.createElement("p")
    usernameAndDate.className = "usernameAndDate"

    const username = document.createElement("span")
    const date = document.createElement("span")
    username.className = "username"
    date.style.fontSize = "15px"
    date.style.whiteSpace = "pre-wrap"

    const messageText = document.createElement("p")
    messageText.className = "messageText"

    usernameAndDate.appendChild(username)
    usernameAndDate.appendChild(date)

    mainChat.appendChild(messageDiv)
    messageDiv.appendChild(messageInfoDiv)
    messageDiv.appendChild(messageContentDiv)
    messageInfoDiv.appendChild(profilePicture)
    messageContentDiv.appendChild(usernameAndDate)
    messageContentDiv.appendChild(messageText)

    var currentAccurateDate = null;

    if (e.createdAt == null) { currentAccurateDate = new Date() } else { currentAccurateDate = e.createdAt.toDate() }

    const timeString = currentAccurateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = currentAccurateDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const [day, month, year] = dateString.split('/');
    const formattedDate = `${timeString} ${day}/${month}/${year}`;

    date.textContent = "   " + formattedDate

    username.textContent = e.user
    profilePicture.src = e.photoURL
    messageText.textContent = e.text

    mainChat.scrollTop = mainChat.scrollHeight
};

const newChatPopup = document.getElementById("newChatPopup");
const popupForm = document.getElementById("popupForm");
const roomInput = document.getElementById("roomInput");
const chatroomName = document.getElementById("chatroomName");

onAuthStateChanged(auth, (user) => {
    if (user) {
        dropdownContent.appendChild(loginRedirect);
        console.log('signed in')
        const theUser = auth.currentUser;

        if (theUser) {
            console.log("signed in");
            console.log(theUser.displayName);
            console.log(String(theUser.photoURL));

            loginRedirect.replaceWith(profileDropdown);

            profileDropdown.style.background = "url('" + theUser.photoURL + "')";
            profileDropdown.style.backgroundSize = "contain";

            name.style.cssText =
                "position:absolute;font-size: 20px; right:75px; text-align-centre; top:0";
            name.textContent = theUser.displayName

            if (chat != null) {

                let room = "main";

                async function changeRoom() {
                    // Clear existing messages when switching rooms
                    mainChat.innerHTML = '';
                    // Query messages for the new room
                    const queryMessages = query(messageRef, where("room", "==", room));
                    onSnapshot(queryMessages, (snapshot) => {
                        messages = [];

                        snapshot.forEach((doc) => {
                            messages.push({ ...doc.data(), id: doc.id }); //thank god for tutorials
                        });
                        messages.sort((a, b) => {
                            if (a.createdAt < b.createdAt) return -1;
                            if (a.createdAt > b.createdAt) return 1;
                            return 0;
                        });

                        // Process sorted messages
                        messages.forEach((message) => {
                            createMessage(message);
                        });
                    });
                }

                async function loadChatroomData() {
                    const userDataRef = doc(firestore, "userData", user.uid);
                    const docSnapshot = await getDoc(userDataRef);
                    
                    if (docSnapshot.exists()) {
                        
                        const userData = docSnapshot.data()
                        if (userData.currentRoom == null) {userData.currentRoom = "main"}
                        
                        userData.chatrooms.forEach((txt) => {
                            createButton(txt);
                        })


                        room = userData.currentRoom
                        chatroomName.textContent = room
                        console.log("Current loaded room: " + userData.currentRoom)
                        
                        await changeRoom()
                        
                    }
                    else { console.error("Failed to load") }
                }

                async function saveChatroomDataToClient(currentRoom) {

                    await loadChatroomData()


                    const buttons = document.getElementsByClassName("switchChatroomBtn")
                    const buttonTextArray = [];

                    for (let item of buttons) {
                        let h2Text = item.querySelector("h2").textContent
                        buttonTextArray.push(h2Text)
                    }
                    await setDoc(doc(firestore, "userData", user.uid), {
                        chatrooms: buttonTextArray,
                        currentRoom: currentRoom
                    })

                    // waits for the chats to load before continuing
                }

                function createButton(txt) {

                    const buttons = document.getElementsByClassName("switchChatroomBtn")

                    for (let item of buttons) {
                        if (item.querySelector("h2").textContent == txt) { return }
                    }

                    const btn = document.createElement("button")
                    btn.className = "switchChatroomBtn"
                    const h2 = document.createElement("h2")
                    h2.textContent = txt;

                    saveChatroomDataToClient(txt);

                    btn.addEventListener("click", async () => {
                        const newRoom = txt

                        await saveChatroomDataToClient(newRoom);
                        room = newRoom;

                        console.log("Currently in: " + newRoom);

                        await changeRoom()
                        chatroomName.textContent = room
                    });

                    btn.addEventListener("contextmenu", async (e) => {
                        e.preventDefault()
                        btn.remove()

                        const buttons = document.getElementsByClassName("switchChatroomBtn")
                        const buttonTextArray = [];
    
                        for (let item of buttons) {
                            let h2Text = item.querySelector("h2").textContent
                            buttonTextArray.push(h2Text)
                        }
                        await setDoc(doc(firestore, "userData", user.uid), {
                            chatrooms: buttonTextArray
                        })
                    })

                    btn.appendChild(h2)
                    chats.appendChild(btn)
                };


                let debounce = false;
                newChatroom.addEventListener("click", () => {
                    if (debounce) {
                        newChatPopup.style.display = "none";
                        debounce = false;
                    } else {
                        roomInput.value = ""
                        newChatPopup.style.display = "flex";
                        roomInput.focus();
                        debounce = true;
                    }
                })

                popupForm.addEventListener("submit", (e) => {
                    debounce = false;
                    e.preventDefault()
                    newChatPopup.style.display = "none"

                    const text = roomInput.value
                    console.log(text)
                    createButton(text);
                })

                //* frickin love javascript syntax (sarcasm)
                const messageRef = collection(firestore, "messages");

                let messages = [];

                // default
                changeRoom();

                const chatFunction = async () => {
                    var message = chat.value;
                    if (message === "") { return }; // if message is blank return

                    await addDoc(messageRef, {
                        text: message,
                        createdAt: serverTimestamp(),
                        user: auth.currentUser.displayName,
                        room: room,
                        photoURL: auth.currentUser.photoURL
                    });

                    chat.value = "";
                };

                sendMessageButton.addEventListener("click", chatFunction);
                chat.addEventListener("keyup", (e) => {
                    if (e.key === "Enter") {
                        chatFunction();
                    };
                });


                createButton("main")

                loadChatroomData();
            };
        }
    }
    else {
        console.log('signed out')
    }
});