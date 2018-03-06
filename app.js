const { combineReducers, bindActionCreators } = Redux;
const { createStore, applyMiddleware, compose } = Redux;
const { connect, Provider } = ReactRedux;
const { createMigrate, persistStore, persistCombineReducers } = ReduxPersist;

// storage proxy
class MyStorage {
  constructor() {
    this.storage = createWebStorage('local');
  }

  async getItem(key) {
    console.log(`getItem(${key})`);
    return await this.storage.getItem(key);
  }

  async setItem(key, value) {
    console.log(`setItem(${key}, ${value})`);
    return await this.storage.setItem(key, value);
  }

  async removeItem(key) {
    console.log(`removeItem(${key})`);
    return await this.storage.removeItem(key);
  }

}

// create storage for redux-persist
const storage = new MyStorage();

const migrations = {
  2: (state) => {
    console.log('%c==> mig 2', 'background-color: #922; color: #fff');
    return {
      ...state,
      foo: 'generation of migration 2'
    }
  },
  3: (state) => {
    console.log('%c==> mig 3', 'background-color: #369; color: #fff');
    return {
      ...state,
      foo: {
        val1: state.foo,
        val2: 'generation of migration 3',
      }
    }
  },
};

class App {
  constructor({ config, initialState, reducer, name }) {
    console.log(`> constructor(${name})`);
    this.config = config;
    this.initialState = initialState;
    this.reducer = reducer;
    this.appName = name;
  }

  configureStore() {
    console.log(persistCombineReducers);
    const reducer = persistCombineReducers(this.config, { foo: this.reducer });
    this.store = createStore(
        reducer
    );
    this.persistor = persistStore(this.store);
  }
}

const appConfigs = {};

// first version of app
appConfigs[1] = ({
  config: {
    storage,
    version: 1,
    key: 'app',
    whitelist: [],
    debug: true,
  },
  initialState: {},
  reducer: (state, action) => {
    state = state || appConfigs[1].initialState;
    console.info('A:', action);
    console.info('S:', state);
//    console.log('------ ' + this.appName, state);
    switch (action.type) {
      default:
        return state;
    }
  },
  name: 'app1',
});

// second version of app
appConfigs[2] = ({
  config: {
    storage,
    version: 2,
    key: 'app',
    whitelist: ['foo', '_persist'],
    migrate: createMigrate(migrations, { debug: true }),
    debug: true,
  },
  initialState: '',
  reducer: (state, action) => {
    state = state || appConfigs[2].initialState;
    console.info('A:', action);
    console.info('S:', state);
    switch (action.type) {
      case 'CHANGE_VAL':
        return action.payload;
      default:
        return state;
    }
  },
  name: 'app2',
});

// third version of app
appConfigs[3] = ({
  config: {
    storage,
    version: 3,
    key: 'app',
    whitelist: ['foo', '_persist'],
    migrate: createMigrate(migrations, { debug: true }),
    debug: true,
  },
  initialState: {
    val1: '',
    val2: '',
  },
  reducer: (state, action) => {
    state = state || appConfigs[3].initialState;
    console.info('A:', action);
    console.info('S:', state);
    switch (action.type) {
      case 'CHANGE_VAL':
        return {
          ...state,
          val1: action.payload,
        };
      default:
        return state;
    }
  },
  name: 'app3',
});


// action
function changeVal(val) {
  return {
    type: 'CHANGE_VAL',
    payload: val,
  };
}


function getApp(appId) {
  return window['app' + appId];
}

function update(appId) {
  const app = getApp(appId);
  app.store.dispatch(changeVal(Date()));
  document.getElementById('root').innerText = JSON.stringify(app.store.getState().val);
}

function purge() {
  getApp(2).persistor.purge();
}

function run(appId) {
  const appName = 'app' + appId;
  window[appName] = new App(appConfigs[appId]);
  const app = window[appName];
  app.configureStore();
  console.log('state: ', app.store.getState());
}
