# Matterbridge Service Command

A service management command-line utility for [Matterbridge](https://github.com/Luligu/matterbridge/), inspired by the [Homebridge Service Command](https://github.com/homebridge/homebridge-config-ui-x/wiki/Homebridge-Service-Command).               

This is currently under development and only supports MacOS at the moment.

```
% git clone https://github.com/michaelahern/mb-service.git
% cd mb-service
% npm install
% npm run build
% npm link

% mb-service
Usage: mb-service <command>
Commands:
  install       Install the Matterbridge service
  uninstall     Uninstall the Matterbridge service
  start         Start the Matterbridge service
  stop          Stop the Matterbridge service
  restart       Restart the Matterbridge service
  pid           Get the process id of the Matterbridge service
  tail          Tail the Matterbridge log file

% sudo mb-service install
Matterbridge Service Installed!
Matterbridge Service Already Running!

Manage Matterbridge in your browser at:
 * http://localhost:8283
 * http://192.168.1.123:8283
 * http://[fd08:b744:dfe5::123]:8283
```
