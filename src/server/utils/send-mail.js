import { bindNodeCallback } from 'rxjs';
import nodemailer from 'nodemailer';
import { email as config } from '../config.js';

function setupTransport(transportsByName, setting) {
  let transport;
  const transportType = (setting.type || 'stub').toLowerCase();
  const transportName = (
    setting.alias ||
    setting.type ||
    'strub'
  ).toLowerCase();
  if (transportType === 'direct') {
    transport = nodemailer.createTransport();
  } else if (transportType === 'smpt') {
    transport = nodemailer.createTransport(setting);
  } else {
    const transportModuleName = `nodemailer-${transportType}-transport`;
    let transportModule;
    try {
      transportModule = require(transportModuleName);
    } catch (e) {
      console.log(
        `could not find module ${transportModuleName} for ${transportName}`,
      );
      throw e;
    }
    transport = nodemailer.createTransport(transportModule(setting));
  }
  const send = bindNodeCallback(transport.sendMail.bind(transport));
  transportsByName[transportName] = send;
  if (!transportsByName['default']) {
    transportsByName['default'] = send;
  }
  return transportsByName;
}

let transports = [];

if (Array.isArray(config.transports)) {
  transports = config.transports;
}

if (config.transport) {
  transports.push(config.transport);
}

const transportsByName = transports.reduce(
  (acc, transport) => setupTransport(acc, transport),
  {},
);

export function sendMail({
  transport: transportName = 'default',
  ...args
}) {
  const send = transportsByName[transportName || 'default'];
  if (!send) {
    throw new Error('No email transport set');
  }
  return send({
    ...args,
    from: config.defaultSender,
  });
}
