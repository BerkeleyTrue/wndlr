import { combineReducers } from 'redux-vertical';
import mainRouterReducer from './routes/redux';

export default function createReducer(...sideReducers) {
  return combineReducers(...sideReducers, mainRouterReducer);
}
