import {envName} from "../../configs";

const StorageType = {
  SESSION: 'SESSION',
  LOCAL: 'LOCAL'
}

export const getStorage = (type: string) => {
  if (type === StorageType.SESSION) {
    return window.sessionStorage;
  }
  return window.localStorage;
};

const setItem = (type: string) => (key: string, value: any) => {
  getStorage(type).setItem(key, JSON.stringify(value));
};

const getItem = (type: string) => (key: string, defaultVal?: any) => {
  const val = getStorage(type).getItem(key);
  if (!val || val === 'undefined') return defaultVal;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
};

const removeItem = (type: string) => (key: string) => {
  getStorage(type).removeItem(key);
};

export const LocalStore = {
  session: {
    get: getItem(StorageType.SESSION),
    set: setItem(StorageType.SESSION),
    remove: removeItem(StorageType.SESSION),
  },
  local: {
    get: getItem(StorageType.LOCAL),
    set: setItem(StorageType.LOCAL),
    remove: removeItem(StorageType.LOCAL),
    clearAll: () => {
      let arr = [];
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage?.key(i)?.substring(0, envName.length) === `${envName}`) {
          arr.push(localStorage.key(i));
        }
      }
      for (let i = 0; i < arr.length; i++) {
        localStorage.removeItem(arr[i]);
      }
    },
    clearByRegex: (str: string) => {
      let arr = [];
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage?.key(i)?.substring(0, `${envName}-${str}`.length) === `${envName}-${str}`) {
          arr.push(localStorage.key(i));
        }
      }
      for (let i = 0; i < arr.length; i++) {
        localStorage.removeItem(arr[i]);
      }
    }
  },
};
