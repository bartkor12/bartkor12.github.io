import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js';

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
const storage = getStorage();

// variables
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const errormsg = document.getElementById("error");

const fileInput = document.getElementById("profileChooser");
const pfp = document.getElementById("pfp");
const loginSuccess = document.getElementById("loginSuccess");

function redirect() {
    loginSuccess.style.display = "flex";

    setTimeout(function () {
        location.replace("/index.html");
    }, 2500);
};


if (loginForm != null) {

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var email = document.getElementById("email").value;
        var password = document.getElementById("password").value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {

                var user = userCredential.user

                redirect();
            })
            .catch((error) => {
                errormsg.textContent = "Error with signing in: " + error
            });
    });
};

if (registerForm != null) {
    
    fileInput.addEventListener('change', function () {

        var file = document.getElementById("profileChooser").files[0];

        var reader = new FileReader();
        // it's onload event and you forgot (parameters)
        reader.onload = function (e) {
            // the result image data
            pfp.src = e.target.result;
        }
        // you have to declare the file loading
        reader.readAsDataURL(file);
    });

    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var email = document.getElementById("email").value;
        var password = document.getElementById("password").value;
        var displayName = document.getElementById("displayName").value;
        var file = document.getElementById("profileChooser").files[0];

        if (displayName.length >= 20) {
            errormsg.textContent =
                "Display name too long, make sure it is less or equal to 20 characters"
            return;
        };

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {

                var user = userCredential.user
                // Signed in

                var storageRef = ref(storage, (user.uid + '/profilePicture/' + file.name));

                uploadBytes(storageRef, file).then((snapshot) => {
                    console.log('Uploaded file succesfully');

                    getDownloadURL(storageRef)
                        .then((url) => {
                            //update user credentials

                            updateProfile(auth.currentUser, {
                                displayName: displayName,
                                photoURL: url
                            })
                                .then(() => {
                                    // Display name updated successfully
                                    console.log("Display name updated:", displayName);
                                    console.log("Profile picture updated:", url);
                                }).catch((error) => {
                                    errormsg.textContent = "Error updating display name:" + error;
                                    return;
                                });

                        })
                        .catch((error) => {
                            errormsg.textContent = "Error converting image to PhotoURL:" + error;
                            return;
                        });

                    //shows login success, redirects

                    redirect();

                });
            })
            .catch((error) => {
                errormsg.textContent = "Error signing up, have you included a profile picture?: " + error;
                return;
            });

    });
};