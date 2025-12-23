require("dotenv").config();

const { user } = require("./config");
const { startApiServers } = require("./api");
const { startScheduler } = require("./scheduler");

console.log(user.publicKey.toString());

startApiServers();
startScheduler();
