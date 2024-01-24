const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv4 = require('uuid').v4;

// Spinning the http server and the WebSocket server.
const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});

// I'm maintaining all active connections in this object
const clients = {};
// I'm maintaining all active users in this object
const users = {};
// The current editor content is maintained here.
let editorContent = null;
// User activity history.
let userActivity = [];

// Event types
const typesDef = {
  USER_EVENT: 'userevent',
  CONTENT_CHANGE: 'contentchange',
};

function broadcastMessage(json) {
  // We are sending the current data to all connected clients
  console.log('json: ', json);
  const data = JSON.stringify(json);
  console.log('data: ', data);
  for (let userId in clients) {
    let client = clients[userId];
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function handleUserEvent(userId, dataFromClient) {
  const json = { type: dataFromClient.type };
  userActivity.push(
    `${dataFromClient.username} joined to edit the document`,
  );
  users[userId] = dataFromClient;
  json.data = { users, userActivity };

  broadcastMessage(json);
}

function handleContentChange(dataFromClient) {
  const json = { type: dataFromClient.type };
  if (dataFromClient?.content) editorContent = dataFromClient.content;
  json.data = { editorContent, userActivity };

  broadcastMessage(json);
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString());
  if (
    dataFromClient.type === typesDef.USER_EVENT &&
    editorContent !== null
  ) {
    handleUserEvent(userId, dataFromClient);
    dataFromClient.type = typesDef.CONTENT_CHANGE;
    handleContentChange(dataFromClient);
  } else if (dataFromClient.type === typesDef.USER_EVENT)
    handleUserEvent(userId, dataFromClient);
  else if (dataFromClient.type === typesDef.CONTENT_CHANGE)
    handleContentChange(dataFromClient);
}

function handleDisconnect(userId) {
  console.log(`${userId} disconnected.`);
  const json = { type: typesDef.USER_EVENT };
  const username = users[userId]?.username || userId;
  userActivity.push(`${username} left the document`);
  json.data = { users, userActivity };
  delete clients[userId];
  delete users[userId];
  broadcastMessage(json);
}

// A new client connection request received
wsServer.on('connection', function (connection) {
  // Generate a unique code for every user
  const userId = uuidv4();
  console.log('Recieved a new connection');
  // Store the new connection and handle messages
  clients[userId] = connection;
  console.log(`${userId} connected.`);
  connection.on('message', (message) =>
    handleMessage(message, userId),
  );
  // User disconnected
  connection.on('close', () => handleDisconnect(userId));
});
