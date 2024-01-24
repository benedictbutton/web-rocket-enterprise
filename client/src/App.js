import React, { useEffect, useState } from 'react';
import { Navbar, NavbarBrand, UncontrolledTooltip } from 'reactstrap';
import useWebSocket, { ReadyState } from 'react-use-websocket';
// import { DefaultEditor } from 'react-simple-wysiwyg';
import { Controlled as CodeMirror } from 'react-codemirror2';
import Editor from './Editor';
import Avatar from 'react-avatar';
import Typography from '@mui/material/Typography';
import 'codemirror/lib/codemirror.css';

import './App.css';

const WS_URL = 'ws://127.0.0.1:8000';

function isUserEvent(message) {
  let evt = JSON.parse(message.data);
  return evt.type === 'userevent';
}

function isDocumentEvent(message) {
  let evt = JSON.parse(message.data);
  return evt.type === 'contentchange';
}

function App() {
  const [username, setUsername] = useState('');
  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => {
      console.log('WebSocket connection established.');
    },
    share: true,
    filter: () => false,
    retryOnError: true,
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (username && readyState === ReadyState.OPEN) {
      sendJsonMessage({
        username,
        type: 'userevent',
      });
    }
  }, [username, sendJsonMessage, readyState]);

  return (
    <>
      <Navbar color="light" light>
        <NavbarBrand href="/">Real-time document editor</NavbarBrand>
      </Navbar>
      <div className="container-fluid">
        {username ? (
          <EditorSection />
        ) : (
          <LoginSection onLogin={setUsername} />
        )}
      </div>
    </>
  );
}

function LoginSection({ onLogin }) {
  const [username, setUsername] = useState('');
  useWebSocket(WS_URL, {
    share: true,
    filter: () => false,
  });
  function logInUser() {
    if (!username.trim()) {
      return;
    }
    onLogin && onLogin(username);
  }

  return (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <p className="account__name">Hello, user!</p>
            <p className="account__sub">Join to edit the document</p>
          </div>
          <input
            name="username"
            onInput={(e) => setUsername(e.target.value)}
            className="form-control"
          />
          <button
            type="button"
            onClick={() => logInUser()}
            className="btn btn-primary account__btn"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

function History() {
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent,
  });
  const activities = lastJsonMessage?.data.userActivity || [];
  return (
    <ul>
      {activities.map((activity, index) => (
        <li key={`activity-${index}`}>{activity}</li>
      ))}
    </ul>
  );
}

function Users() {
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isUserEvent,
  });
  const users = Object.values(lastJsonMessage?.data.users || {});
  return users.map((user) => (
    <div key={user.username}>
      <span
        id={user.username}
        className="userInfo"
        key={user.username}
      >
        <Avatar name={user.username} size={40} round="20px" />
      </span>
      <UncontrolledTooltip placement="top" target={user.username}>
        {user.username}
      </UncontrolledTooltip>
    </div>
  ));
}

function EditorSection() {
  return (
    <div className="main-content">
      <div className="document-holder">
        <div className="currentusers">
          <Users />
        </div>
        <Document />
      </div>
    </div>
  );
}

function Document() {
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(WS_URL, {
    share: true,
    filter: isDocumentEvent,
  });

  let html = lastJsonMessage?.data.editorContent;

  function handleHtmlChange(value) {
    sendJsonMessage({
      type: 'contentchange',
      content: value,
    });
  }

  return (
    <>
      {/* <DefaultEditor value={html} onChange={handleHtmlChange} />*/}
      <div className="top-container">
        <div className="left-box">
          <h2>
            <b>Code</b>
          </h2>
          <CodeMirror
            value={html}
            height="500px"
            options={{
              lineWrapping: true,
              lint: true,
              lineNumbers: true,
              autoCloseTags: true,
              autoCloseBrackets: true,
            }}
            onBeforeChange={(editor, data, value) => {
              handleHtmlChange(value);
            }}
            style={{ border: 'solid black 3', lineHeight: '3' }}
          />
          <Typography component="p" variant="h5">
            <b>Instructions:</b> You are the Chief Engineer on the
            spaceship USS Yorktown. Like it's namesake, your ship
            needs to depart before the ship is fully repaired. It is
            up to you to get the ship working. Above is the code for
            left and right navigation. Uncomment the relevant lines of
            code to fix the ship's navigation controls.
          </Typography>
        </div>
        <div className="right-box" id="game">
          <Editor value={html} />
        </div>
        <div className="history-holder">
          <History />
        </div>
      </div>
    </>
  );
}

export default App;
