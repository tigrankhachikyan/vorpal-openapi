const localStorageKeys = require('./local-storage-keys');

function setAuthStringAction(command, args, schemeKey) {
  command.log();

  // try to get auth object from local storage (initialize if missing or invalid)
  const authJson = command.parent.localStorage.getItem(localStorageKeys.AUTH);
  let auth = null;
  try {
    auth = authJson
      ? JSON.parse(authJson)
      : { specSecurity: [], authorized: {} };
  } catch (err) {
    auth = { specSecurity: [], authorized: {} };
  }

  // 1. defined securityDefinition in the specSecurity
  auth.specSecurity.push(schemeKey);

  // 2. provide auth data in authorized
  if (args.value.match(/:/)) {
    // Basic Auth
    const [username, password] = args.value.split(':');

    auth.authorized[schemeKey] = { value: { username, password } };
  } else {
    auth.authorized[schemeKey] = { value: args.value };
  }

  command.parent.localStorage.setItem(
    localStorageKeys.AUTH,
    JSON.stringify(auth)
  );
  command.log('Authentication set');

  command.log();

  return Promise.resolve();
}

module.exports = setAuthStringAction;
