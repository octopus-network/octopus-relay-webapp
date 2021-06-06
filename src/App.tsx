import React, { Suspense } from "react";

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Main from './views/Main';

import Home from './views/Home';
import Wallet from './views/Wallet';
import Register from './views/Register';
import Update from './views/Update';

import AppchainList from './views/AppchainList';
import Appchain from './views/Appchain';

function App(): React.ReactElement {
  return (
    <Suspense fallback='...'>
      <Router>
        <Routes>
          <Route path='/' element={<Main />}>
            <Route path='' element={<Navigate to='home' />} />
            <Route path='home' element={<Home />} />
            <Route path='wallet' element={<Wallet />} />
            <Route path='appchains/register' element={<Register />} />
            <Route path='update/:id' element={<Update />} />
            <Route path='appchains' element={<AppchainList />} />
            <Route path='appchains/:id' element={<Appchain />} />
            <Route path='appchains/:id/:tab' element={<Appchain />} />
          </Route>
          
        </Routes>
      </Router>
    </Suspense>
  );
}

export default React.memo(App);