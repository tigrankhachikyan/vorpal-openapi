import * as _ from 'lodash';
import Swagger = require('swagger-client');

import * as commandOptionNames from './command-option-names';
import { OperationCommandAction } from './operation-command-action';
import { OperationCommandInfo } from './operation-command-info';
import { OperationCommandValidator } from './operation-command-validator';
import { Options } from './options';

export class OperationCommandBuilder {
  constructor(private vorpal, private options: Options) {
  }

  public build(commandInfo: OperationCommandInfo) {
    const commandString = this.buildCommandString(commandInfo, this.options);
    const commandDescription = commandInfo.operation.summary;
    const command = this.vorpal.command(commandString, commandDescription);

    // add option for response content type (based on values in produces array)
    if (commandInfo.operation.produces && commandInfo.operation.produces.length > 0) {
      command.option('--' + commandOptionNames.RESPONSE_CONTENT_TYPE +
        ' <mime-type>', 'desired MIME type of response body', commandInfo.operation.produces);
    }

    // add option for each optional parameter,
    // for enum parameters, add an autocomplete for each possible value
    const optionalParameters = _.filter(commandInfo.operation.parameters, { required: false });
    for (const parameter of optionalParameters) {
      const optionString = '--' + parameter.name;
      const optionDescription = parameter.description;
      const optionAutocomplete = parameter.items ? (parameter.items.enum || null) : null;
      command.option(optionString, optionDescription, optionAutocomplete);
    }

    const validator = new OperationCommandValidator(commandInfo, this.vorpal);
    command.validate((args) => validator.validate(args));

    const swaggerClientPromise = Swagger({ spec: this.options.spec });
    const action = new OperationCommandAction(swaggerClientPromise, commandInfo, this.vorpal);
    command.action((args) => action.run(args));

    return command;
  }

  private buildCommandString(commandInfo: OperationCommandInfo, options: Options): string {
    let commandString = '';

    commandString += commandInfo.commandStringParts.join(' ');

    // append required parameters to command string
    const requiredParameters = _.filter(commandInfo.operation.parameters, { required: true });
    for (const parameter of requiredParameters) {
      commandString += ' <' + parameter.name + '>';
    }

    return commandString;
  }
}