const _ = require('lodash');

const setAuthStringAction = require('./set-auth-string-action');

function setAuthApiKeyCommandBuilder(vorpal, options) {
  const commands = [];

  for (const schemeKey of _.keys(options.spec.securityDefinitions)) {
    const scheme = options.spec.securityDefinitions[schemeKey];
    if (scheme.type !== 'apiKey') {
      continue;
    }

    const command = vorpal
      .command(
        `set-auth ${_.kebabCase(schemeKey)} <value>`,
        `Set API key authorization value for security scheme '${schemeKey}'`
      )
      .action(args =>
        setAuthStringAction(vorpal.activeCommand, args, schemeKey)
      );
    commands.push(command);
  }

  return commands;
}

module.exports = setAuthApiKeyCommandBuilder;