import React from 'react'
import { render } from 'react-dom'
import { Provider } from "react-redux";

import Main from './main'
import store from './store';

window.React = React
const parent = document.getElementById('main-react-app');

if(!!parent){
	render(<Provider store={store}><Main /></Provider>, parent);
}