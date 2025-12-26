import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Grommet } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import QuoteList from './components/QuoteList';
import QuoteEditor from './components/QuoteEditor';

function App() {
  return (
    <Grommet theme={hpe} full>
      <Router>
        <Routes>
          <Route path="/" element={<QuoteList />} />
          <Route path="/quote/:quoteId" element={<QuoteEditor />} />
        </Routes>
      </Router>
    </Grommet>
  );
}

export default App;
