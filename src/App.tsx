import React, { Suspense } from "react";

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Main from './views/Main';

import Home from './views/Home';
import Appchain from './views/Appchain';

function App(): React.ReactElement {
  return (
    <Suspense fallback='...'>
      <Router>
        <Routes>
          <Route path='/' element={<Main />}>
            <Route path='' element={<Navigate to='home' />} />
            <Route path='home' element={<Home />} />
            <Route path='appchain/:id' element={<Appchain />} />
          </Route>
          
        </Routes>
      </Router>
    </Suspense>
  );
}

export default React.memo(App);