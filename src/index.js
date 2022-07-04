
/*
const {React} = require('react');
const { createRoot } = require('react-dom/client');
const App = require('./App.js');
*/

import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);