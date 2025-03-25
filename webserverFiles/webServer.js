var portNumber = 3579; // Changed to 8080 (or any other free port)
var express = require("express");
var app = express();
const fs = require('fs');
const path = require('path');

app.use(express.static('public'));

app.get("/", function (request, response) {
    response.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/png', express.static('public/images'));

app.listen(portNumber, (err) => {
    if (err) {
        console.error("Error starting server:", err);  
    } else { 
        console.log(`Opticol Web Server | [STATUS: ONLINE]`);
        console.log(`Active Link: http://localhost:${portNumber}`)
    }
});

app.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[ERROR] Port ${portNumber} is already in use. Choose another port.`);
    } else {
        console.error('Server error:');
    }
});