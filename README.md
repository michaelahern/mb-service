# Matterbridge Service Command

[![npm](https://badgen.net/npm/v/mb-service)](https://www.npmjs.com/package/mb-service)
[![node](https://badgen.net/npm/node/mb-service)](https://www.npmjs.com/package/mb-service)
[![downloads](https://badgen.net/npm/dt/mb-service)](https://www.npmjs.com/package/mb-service)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/michaelahern/mb-service)

A service management command-line utility for [Matterbridge](https://github.com/Luligu/matterbridge/), inspired by [Homebridge's](https://github.com/homebridge/homebridge-config-ui-x/wiki/Homebridge-Service-Command) `hb-service`.               

This command-line utility is primarily focused on supporting the macOS platform, as that is my primary platform at home, but it does have experimental support for Linux. The author of [Matterbridge](https://github.com/Luligu/matterbridge/) now has a dedicated utility for supporting Linux, [mb-service-linux](https://github.com/Luligu/mb-service-linux), which is a more mature option for Linux users.

```
% npm install -g matterbridge mb-service --omit=dev

% mb-service
Usage: mb-service <command> [options]

Commands:
  install       Install the Matterbridge service
  uninstall     Uninstall the Matterbridge service
  start         Start the Matterbridge service
  stop          Stop the Matterbridge service
  restart       Restart the Matterbridge service
  pid           Get the process id of the Matterbridge service
  tail          Tail the Matterbridge log file

Global Options:
  -h, --help
  -v, --version

Install Options:
  --frontend <port>
  --ssl

% sudo mb-service install
Matterbridge Service Installed!
Starting Matterbridge Service...

Manage Matterbridge in your browser at:
 * http://localhost:8283
 * http://192.168.1.123:8283
 * http://[fd08:b744:dfe5::123]:8283
```

## How This Project Uses `launchd` on macOS

On macOS, `mb-service` manages the Matterbridge service using the native `launchd` system. It creates a Launch Daemon configuration file at `/Library/LaunchDaemons/com.matterbridge.plist`. This file tells `launchd` how to start, stop, and manage the Matterbridge process as a background service.

You can inspect the service status and configuration using:

```
% launchctl print system/com.matterbridge
system/com.matterbridge = {
    active count = 1
    path = /Library/LaunchDaemons/com.matterbridge.plist
    type = LaunchDaemon
    state = running

    program = /opt/homebrew/bin/matterbridge
    arguments = {
        /opt/homebrew/bin/matterbridge
        -service
        -nosudo
    }

    stdout path = /Users/me/.matterbridge/matterbridge.log
    stderr path = /Users/me/.matterbridge/matterbridge.log
    default environment = {
        PATH => /usr/bin:/bin:/usr/sbin:/sbin
    }

    environment = {
        PATH => /opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
        HOME => /Users/me
        XPC_SERVICE_NAME => com.matterbridge
    }

    ...
}
```
