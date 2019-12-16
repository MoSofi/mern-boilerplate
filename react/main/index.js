import React from 'react';
import { Router, Route, Switch } from "react-router-dom";

import {createBrowserHistory} from 'history'
const browserHistory = createBrowserHistory();

import Header from './parts/Header';
import Footer from './parts/Footer';

import { Nothing } from '../static-pages/Nothing';
import { Terms } from '../static-pages/Terms';

import Home from './Home';

window.React = React;

class Main extends React.Component {
	render() {
		return (
			<Router history={browserHistory}>
				<div id="app-wrapper">
					<Header />

					<Switch>
						<Route exact path="/" component={Home} />
						<Route exact path="/terms" component={Terms} />

						<Route component={Nothing} />
					</Switch>

					<Footer />
				</div>
			</Router>
		);
	}
}

module.exports = Main;