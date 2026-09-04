require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
  extensions: ['.ts', '.tsx']
});
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const App = require('./src/App.tsx').default;

try {
  ReactDOMServer.renderToString(React.createElement(App));
  console.log("Render successful");
} catch (e) {
  console.error("Render failed:");
  console.error(e);
}
