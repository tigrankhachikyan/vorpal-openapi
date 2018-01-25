import * as _ from 'lodash';

import * as aboutCommand from './about-command';
import * as commandBuilder from './command-builder';
import * as commandGroupTypes from './command-group-types';
import { CommandInfo } from './command-info';
import { Options } from './options';
import * as stringUtils from './string-utils';
import { TextBuilder } from './text-builder';

export function build(vorpal, options: Options) {
  let delimiter;
  if (options.spec.info.title) {
    delimiter = _.kebabCase(options.spec.info.title) + '$';
  } else {
    delimiter = 'vorpal-swagger$';
  }
  vorpal.delimiter(delimiter);

  let historyString;
  if (options.spec.info.title) {
    historyString = _.kebabCase(options.spec.info.title);
  } else {
    historyString = 'vorpal-swagger-' + process.pid;
  }
  vorpal.history(historyString);

  let localStorageString;
  if (options.spec.info.title) {
    localStorageString = _.kebabCase(options.spec.info.title);
  } else {
    localStorageString = 'vorpal-swagger-' + process.pid;
  }
  vorpal.localStorage(localStorageString);

  if (options.spec.info) {
    vorpal
      .command('about', 'Displays information about the API.')
      .action((args, cb) => {
        aboutCommand.run(vorpal, options.spec.info, cb);
      });
  }

  // TODO: add commands for setting auth

  let commandInfos = [];
  switch ((options.operations.groupBy || '').toLowerCase()) {
    case commandGroupTypes.PATH:
      commandInfos = getCommandInfosByPaths(options.spec);
      break;
    case commandGroupTypes.TAG:
      commandInfos = getCommandInfosByTags(options.spec);
      break;
    default:
      commandInfos = getCommandInfosForDefault(options.spec);
      break;
  }

  // sort commands by command string parts;
  // this will ensure any that should be grouped together are listed consecutively
  const sortedCommandInfos = _.sortBy(commandInfos, (info: CommandInfo) => {
    return info.commandStringParts[0] + ' ' + (info.commandStringParts[1] || '');
  });

  for (const info of sortedCommandInfos) {
    const command = commandBuilder.build(info, vorpal, options);
  }

  writeSplash(vorpal, options);
}

function getCommandInfosByPaths(spec): CommandInfo[] {
  const infos = [];

  const pathKeys = _.keys(spec.paths);
  for (const pathKey of pathKeys) {
    const path = spec.paths[pathKey];

    const operationKeys = _.keys(path);
    for (const operationKey of operationKeys) {
      const operation = path[operationKey];

      // split path into parts by slash (trim off if the path starts with one)
      const pathKeyParts = _.trimStart(pathKey, '/').split('/');

      infos.push({
        commandStringParts: [
          _.kebabCase(pathKeyParts[0]),
          _.kebabCase(operation.operationId),
        ],
        operation,
        pathKey,
      });
    }
  }

  return infos;
}

function getCommandInfosByTags(spec): CommandInfo[] {
  const infos = [];

  const pathKeys = _.keys(spec.paths);
  for (const pathKey of pathKeys) {
    const path = spec.paths[pathKey];

    const operationKeys = _.keys(path);
    for (const operationKey of operationKeys) {
      const operation = path[operationKey];

      for (const tagName of operation.tags) {
        infos.push({
          commandStringParts: [
            _.kebabCase(tagName),
            _.kebabCase(operation.operationId),
          ],
          operation,
          pathKey,
        });
      }
    }
  }

  return infos;
}

function getCommandInfosForDefault(spec): CommandInfo[] {
  const infos = [];

  const pathKeys = _.keys(spec.paths);
  for (const pathKey of pathKeys) {
    const path = spec.paths[pathKey];

    const operationKeys = _.keys(path);
    for (const operationKey of operationKeys) {
      const operation = path[operationKey];

      infos.push({
        commandStringParts: [
          _.kebabCase(operation.operationId),
        ],
        operation,
        pathKey,
      });
    }
  }

  return infos;
}

function writeSplash(vorpal, options: Options) {
  // TODO: need to do better null checking of full path of properties

  const splashBuilder = new TextBuilder();

  splashBuilder.addLine();

  const version = options.spec.info.version ? 'Version ' + options.spec.info.version : '';
  const heading = stringUtils.joinNonEmpty([options.spec.info.title, version], '\n');
  splashBuilder.addParagraph(heading);

  splashBuilder.addLine();

  vorpal.log(splashBuilder.toString());
}