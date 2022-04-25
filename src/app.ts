import express from 'express';

// <--------------------------------------------------------------------------->
const { Server } = require('ws');
const mongoose = require('mongoose');
const crypto = require('crypto');
// <------------------------   Locate file ------------------------------------>
const User = require('./models/user.ts');

// <-------------------------- port ------------------------------------------->
const PORT = process.env.PORT || 3000;

// <--------------------------------------------------------------------------->
const server = express()
    .use((req, res) => res.send("API is 🎉ready"))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

// <--------------------------------------------------------------------------->
const wss = new Server({ server });

//? <----------------- connection to mongodb or Open MongoDB ------------------>
mongoose.connect('CONNECTION_MONGODB')
    .then((_: any) => console.log("Connected to database."))
    .catch((e: Error) => console.log("Error:", e)); // Open MongoDB.

wss.on('connection', function (ws: any, req: Request) {
    //! <-----------  // If there is any message ---------------------------------->    
    ws.on('message', (message: { toString: () => any; }) => {
        var datastring = message.toString();
        if (datastring.charAt(0) == "{") {
            //<----- Check if message starts with '{' to check if it's json --->
            datastring = datastring.replace(/\'/g, '"');
            var data = JSON.parse(datastring)

            if (data.cmd === 'signup') { // On Signup
                //<------- If mail doesn't exists it will return null ---------->
                User.findOne({ email: data.email }).then((mail: any) => {
                    // <------ Check if email doesn't exist -------------------->
                    if (mail == null) {
                        User.findOne({ username: data.username }).then((user: any) => {
                            // <--- Check if username doesn't exists ----------->
                            if (user == null) {
                                const hash = crypto.createHash("md5")
                                let hexPwd = hash.update(data.hash).digest('hex');
                                var signupData = "{'cmd':'" + data.cmd + "','status':'succes'}";
                                const user = new User({
                                    email: data.email,
                                    username: data.username,
                                    password: hexPwd,
                                });
                                // <------- Insert new user in db -------------->
                                user.save();
                                //<-------- Send info to user ------------------>
                                ws.send(signupData);
                            } else {
                                // <------------ Send error message to user ---->
                                var signupData = "{'cmd':'" + data.cmd + "','status':'user_exists'}";
                                ws.send(signupData);
                            }
                        });
                    } else {
                        // <----- Send error message to user ----------------->
                        var signupData = "{'cmd':'" + data.cmd + "','status':'mail_exists'}";
                        ws.send(signupData);
                    }
                });
            }

            if (data.cmd === 'login') {
                // <------- Check if email exists ------------------> 
                User.findOne({ email: data.email }).then((r: any) => {
                    // <------- If email doesn't exists it will return null --->
                    if (r != null) {
                        const hash = crypto.createHash("md5")
                        // <--------- Hash password to md5 --------->
                        let hexPwd = hash.update(data.hashcode).digest('hex');
                        // <---- Check if password is correct ------------->
                        if (hexPwd == r.password) {
                            // <-- Send username to user and status code is succes -->
                            var loginData = '{"username":"' + r.username + '","status":"succes"}';
                            // <--- Send data back to user ------->
                            ws.send(loginData);
                        } else {
                            // <-------- Send error --------->
                            var loginData = '{"cmd":"' + data.cmd + '","status":"wrong_pass"}';
                            ws.send(loginData);
                        }
                    } else {
                        // <------ Send error -------------->
                        var loginData = '{"cmd":"' + data.cmd + '","status":"wrong_mail"}';
                        ws.send(loginData);
                    }
                });
            }
        }
    })
})

// app.listen(8085, () => { console.log("Server is 🏃‍♂️ running"); })