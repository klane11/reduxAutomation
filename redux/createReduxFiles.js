const fs = require("fs");
const _ = require("lodash");

// argument 1 - name: should be camel cased if multiple words ex: productPrices
// argument 2 - type: update, delete, get - should be all lowercase
// argument 3 - request: put, get, delete, post - should be all lowercase
// argument 4 - path: path to database 'catalog_items/product_prices'

function handleCreateDynamicFiles() {
  var name = process.argv[2];
  var type = process.argv[3];
  var request = process.argv[4];
  var path = process.argv[5];

  const actionCreatorPath = `./${name}ActionCreators.js`;
  const actionCreatorContent = createActionCreatorContent(
    name,
    type,
    request,
    path
  );
  createFile(actionCreatorContent, actionCreatorPath);

  const actionsPath = `./${name}Actions.js`;
  const actionsContent = createActions(name, type);
  createFile(actionsContent, actionsPath);

  const reducerContent = createReducer(name, type);
  const reducerPath = `./${name}Reducer.js`;
  createFile(reducerContent, reducerPath);
}

function createFile(fileContent, filePath) {
  fs.writeFile(filePath, fileContent, error => {
    if (error) throw error;
    console.log(`File ${filePath} was saved!`);
  });
}

function createActionCreatorContent(name, type, request, path) {
  var nameUpperFirst = _.upperFirst(name);
  var nameCamelCased = _.camelCase(name);
  var typeUpperFirst = _.upperFirst(type);
  var typeLowerCased = _.toLower(type);
  var requestLowerCased = _.toLower(request);

  return `
import {
  ${typeLowerCased}${nameUpperFirst}Succeeded,
  ${typeLowerCased}${nameUpperFirst}Started,
  ${typeLowerCased}${nameUpperFirst}Failed,
} from '../actions/${nameCamelCased}Actions';
import Instance from '../../initializers/axiosInstance';

function on${typeUpperFirst}${nameUpperFirst}Started() {
  return dispatch => dispatch(${typeLowerCased}${nameUpperFirst}Started());
}
function on${typeUpperFirst}${nameUpperFirst}Succeeded(response) {
  return dispatch => dispatch(${typeLowerCased}${nameUpperFirst}Succeeded(response));
}
function on${typeUpperFirst}${nameUpperFirst}Failed(error) {
  return dispatch => dispatch(${typeLowerCased}${nameUpperFirst}Failed(error));
}

export default function ${typeLowerCased}${nameUpperFirst}() {
  return dispatch => { 
    dispatch(on${typeUpperFirst}${nameUpperFirst}Started());
    return Instance.axiosInstance()
      .${requestLowerCased}('/${path}')
      .then(response => {
        dispatch(on${typeUpperFirst}${nameUpperFirst}Succeeded(response.data));
        return response.data;
      })
      .catch(error => {
        dispatch(on${typeUpperFirst}${nameUpperFirst}Failed(error));
        throw error;
      });
  };
}
`;
}

function createActions(name, type) {
  var nameUpperSnakeCased = _.toUpper(_.snakeCase(name));
  var nameUpperFirst = _.upperFirst(name);
  var typeUpperCased = _.toUpper(type);
  var typeLowerCased = _.toLower(type);
  var typeUpperCased = _.toUpper(type);

  return `
import actionFactory from '../../initializers/actionFactory';

export const ${typeUpperCased}_${nameUpperSnakeCased}_STARTED = '${typeUpperCased}_${nameUpperSnakeCased}_STARTED';
export const ${typeUpperCased}_${nameUpperSnakeCased}_SUCCEEDED = '${typeUpperCased}_${nameUpperSnakeCased}_SUCCEEDED';
export const ${typeUpperCased}_${nameUpperSnakeCased}_FAILED = '${typeUpperCased}_${nameUpperSnakeCased}_FAILED';

export const ${typeLowerCased}${nameUpperFirst}Started = actionFactory(${typeUpperCased}_${nameUpperSnakeCased}_STARTED);
export const ${typeLowerCased}${nameUpperFirst}Succeeded = actionFactory(${typeUpperCased}_${nameUpperSnakeCased}_SUCCEEDED);
export const ${typeLowerCased}${nameUpperFirst}Failed = actionFactory(${typeUpperCased}_${nameUpperSnakeCased}_FAILED);
  `;
}

function createReducer(name, type) {
  var nameLowerCased = _.toLower(name);
  var nameUpperSnakeCased = _.toUpper(_.snakeCase(name));
  var nameCamelCased = _.camelCase(name);
  var nameUpperFirst = _.upperFirst(name);
  var typeUpperFirst = _.upperFirst(type);
  var typeUpperCased = _.toUpper(type);

  return `
import update from 'immutability-helper';
import reducerFactory from '../../initializers/reducerFactory';

import {
  ${typeUpperCased}_${nameUpperSnakeCased}_STARTED,
  ${typeUpperCased}_${nameUpperSnakeCased}_SUCCEEDED,
  ${typeUpperCased}_${nameUpperSnakeCased}_FAILED,
} from '../actions/${nameCamelCased}Actions';

const INITIAL_STATE = {
  isLoading: false,
};

function on${typeUpperFirst}${nameUpperFirst}Started(state) {
  return update(state, {
    $merge: {
      isLoading: true,
    },
  });
}
function on${typeUpperFirst}${nameUpperFirst}Succeeded(state, response) {
  return update(state, {
    $merge: {
      isLoading: false,
    },
  });
}
function on${typeUpperFirst}${nameUpperFirst}Failed(state) {
  return update(state, {
    $merge: {
      isLoading: false,
    },
  });
}

const functionMap = {
  [${typeUpperCased}_${nameUpperSnakeCased}_STARTED]: on${typeUpperFirst}${nameUpperFirst}Started,
  [${typeUpperCased}_${nameUpperSnakeCased}_SUCCEEDED]: on${typeUpperFirst}${nameUpperFirst}Succeeded,
  [${typeUpperCased}_${nameUpperSnakeCased}_FAILED]: on${typeUpperFirst}${nameUpperFirst}Failed,
};

export default reducerFactory(functionMap, INITIAL_STATE, '${name}');
`;
}

handleCreateDynamicFiles();
