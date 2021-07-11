import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import MakeRoom from "./Main/MakeRoom";
import Rooms from "./Main/Rooms";
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={MakeRoom} />
          <Route path="/room/:meetID" component={Rooms} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;