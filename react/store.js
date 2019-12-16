import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import multi from 'redux-multi';
import promise from "redux-promise-middleware";

import generalReducer from './reducers/GeneralReducer';

// make a store of multiple reducers
export default createStore(
	combineReducers({
		generalReducer
	}),
	{} ,
	applyMiddleware(thunk, multi, promise())
);