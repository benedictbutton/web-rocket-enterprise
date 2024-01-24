import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';

const Editor = ({ value }) => {
  const [openedEditor, setOpenedEditor] = useState('js');
  //   const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('js');
  const [srcDoc, setSrcDoc] = useState(` `);

  let html = `
  <h2 class="right-box-title">Game View</h2>
  <img id="test" src="space-ship.svg" alt="spaceship"/>
`;
  // <style>${css}</style>

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setSrcDoc(
        `
          <html>
            <body style="margin: 0; background-color:  #d0d0d0;">${html}</body>
            <style>
                #test {
                    width: 75px;
                    height: 75px;
                }

                .right-box-title {
                    margin-top: 0;
                    font-size: 2rem;
                }

                /* Style for the game view */
                .game-canvas {
                    width: 100%;
                    height: 80%;
                    background-color: black;
                }
            </style>
            <script>${value}</script>
          </html>
        `,
      );
    }, 250);
    return () => clearTimeout(timeOut);
  }, [html, js, value]);

  return (
    <iframe
      srcDoc={srcDoc}
      title="output"
      sandbox="allow-scripts"
      border="solid"
      width="100%"
      height="100%"
    />
  );
};

export default Editor;
