import { combineReducers } from 'redux-vertical';
import mainRouterReducer from './routes/redux';
import authReducer from './Auth/redux';

export default function createReducer(...sideReducers) {
  return combineReducers(...sideReducers, mainRouterReducer, authReducer);
}
