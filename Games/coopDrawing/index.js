import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getDatabase, ref, set, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js"

const pickr = Pickr.create({
    el: '.color-picker',
    theme: 'nano', // or 'monolith', or 'nano'

    swatches: [
        'rgba(244, 67, 54, 1)',
        'rgba(233, 30, 99, 0.95)',
        'rgba(156, 39, 176, 0.9)',
        'rgba(103, 58, 183, 0.85)',
        'rgba(63, 81, 181, 0.8)',
        'rgba(33, 150, 243, 0.75)',
        'rgba(3, 169, 244, 0.7)',
        'rgba(0, 188, 212, 0.7)',
        'rgba(0, 150, 136, 0.75)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(139, 195, 74, 0.85)',
        'rgba(205, 220, 57, 0.9)',
        'rgba(255, 235, 59, 0.95)',
        'rgba(255, 193, 7, 1)'
    ],

    components: {

        // Main components
        preview: true,
        hue: true,

        // Input / output Options
        interaction: {
            hex: true,
            rgba: true,
            input: true
        }
    }
});

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

// variables

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const signinmessage = document.getElementById("signinmessage")
const cursor = document.getElementById("cursor")
const users = document.getElementById("users")

// it has taken me a whole day to realize to just set this to 1920x1080 instead
// of window size I am going mad
canvas.width = 1920
canvas.height = 1080

onAuthStateChanged(auth, (user) => {
    if (user) {

        const canvasRef = ref(database, "public/coopDrawingCanvas/URL")
        const onlineUsersRef = ref(database, "public/coopDrawingCanvas/online/" + auth.currentUser.uid)

        onValue(canvasRef, (snapshot) => {
            ctx.beginPath()
            const data = snapshot.val()
            var img = new Image
            img.src = data["URL"]
            img.onload = () => {
                ctx.drawImage(img, 0, 0)
            }
            img.remove()
        })

        set(onlineUsersRef, {
            info: {
                username: auth.currentUser.displayName,
                x: 0,
                y: 0
            }
        });

        let currentStrokeStyle = "black"

        ctx.strokeStyle = currentStrokeStyle

        pickr.on('init', instance => { })
            .on("change", (color, source, instance) => {
                ctx.strokeStyle = color.toRGBA()
                currentStrokeStyle = color.toRGBA()
            })

        let painting = false
        let lineWidth = 5


        function createUsername(name) {
            const nameDiv = document.createElement("div")
            nameDiv.className = "name"
            nameDiv.textContent = name
            users.appendChild(nameDiv)
            console.log("Creating")
            return nameDiv
        }

        const nameDiv = createUsername(auth.currentUser.displayName)
        let nameDivObject = {}

        let mousemovecooldown = 40

        canvas.addEventListener("mousemove", (e) => {
            if (mousemovecooldown > 0) {
                mousemovecooldown -= 1
            } else {
                mousemovecooldown = 40
                const info = {
                    username: auth.currentUser.displayName,
                    x: e.clientX,
                    y: e.clientY
                }
                set(onlineUsersRef, {
                    info
                })

            }
            nameDiv.style.display = "block"
            nameDiv.style.transform = `translate3d(${e.clientX + lineWidth / 2}px, ${e.clientY - lineWidth / 2 - 20}px, 0)`
        })

        onValue(ref(database, "public/coopDrawingCanvas/online"), (snapshot) => {
            snapshot.forEach((data) => {
                data = data.val().info
                if (data["username"] != auth.currentUser.displayName) {
                    // If user is not online, remove the corresponding otherNameDiv
                    if (!nameDivObject[data.username]) {
                        nameDivObject[data.username] = {}
                        nameDivObject[data.username].nameDiv = createUsername(data["username"])
                    }
                    const otherNameDiv = nameDivObject[data.username]["nameDiv"]
                    otherNameDiv.style.transform = `translate3d(${data["x"]}px, ${data["y"]}px, 0)`
                }
            })
        })


        cursor.style.width = lineWidth + "px"
        cursor.style.height = lineWidth + "px"

        var mouseEvent

        function draw(e) {
            mouseEvent = e
            cursor.style.visibility = "visible"
            nameDiv.style.visibility = "visible"
            cursor.style.transform = `translate3d(${e.clientX - lineWidth / 2}px, ${e.clientY - lineWidth / 2}px, 0)`
            //if not painting
            if (painting) {

                ctx.lineWidth = lineWidth;
                ctx.lineCap = "round"
                ctx.miterLimit = 1;

                ctx.lineTo(e.clientX, e.clientY)
                ctx.stroke()
            }
        }

        document.body.addEventListener("contextmenu", (e) => {
            e.preventDefault()
        })

        canvas.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                painting = true
            } else if (e.button === 2) {
                ctx.strokeStyle = "white"
                painting = true
            }
        })


        canvas.addEventListener("mouseup", (e) => {

            ctx.strokeStyle = currentStrokeStyle

            painting = false

            var data_url = canvas.toDataURL("image/jpeg")
            var head = 'data:image/jpeg;base64';
            var imgFileSize = Math.round((data_url.length - head.length) * 3 / 4);

            console.log(imgFileSize / 1000 + "kb")
            set(canvasRef, {
                URL: data_url
            })
        })

        canvas.addEventListener("mousemove", draw)

        canvas.addEventListener("mouseout", () => {
            cursor.style.visibility = "hidden"
            nameDiv.style.visibility = "hidden"
        })

        document.addEventListener("keypress", (e) => {

            if (e.key === ".") {
                lineWidth += 6
                lineWidth = Math.abs(lineWidth)
            }
            if (e.key === ",") {
                lineWidth -= 6
                lineWidth = Math.abs(lineWidth)
            }

            cursor.style.transform = `translate3d(${mouseEvent.clientX - lineWidth / 2}px, ${mouseEvent.clientY - lineWidth / 2}px, 0)`
            nameDiv.style.transform = `translate3d(${mouseEvent.clientX + lineWidth / 2}px, ${mouseEvent.clientY - lineWidth / 2 - 20}px, 0)`

            cursor.style.width = lineWidth + "px"
            cursor.style.height = lineWidth + "px"
        })

        const onDisconnectRef = ref(database, "public/coopDrawingCanvas/online/" + auth.currentUser.uid);
        onDisconnect(onDisconnectRef).remove();

    } else {
        signinmessage.style.display = "flex"
    }
})