# Live2DBot v0.4.3sleepypurin

An all-in-one Twitch bot for VTubers with VTube Studio integration. Download the program [here](https://github.com/Kimi0n/live2dbot-public/releases).

## Features
### Vtube Studio integration
Switch models, toggle hotkeys, add RGB and more. Control directly from the plugin or using chat commands.

### Dynamic command configuration
Changes to your commands are active immediately. No waiting, no reloading, no reconnecting.

### Commands and channel points
The bot's entire functionality can be setup as chat commands and channel point redeems (text based only for now).

### Fast bot response times
No outside server that can experience slowdowns or outages. The bot is hosted locally on your computer.

### Extendability 
Add functionality with the API call commands. If the API you want has a simple, unauthorized get request and returns a JSON or audio, you can add it.

### Truly free and open source
No microtransactions, no subscriptions, 100% free.

## What you need
- VTube Studio 1.22.0 or newer.
- A modern Chromium based browser or Firefox.

## Feature ideas that may be realized at some point
- Sound redeems (single mp3/wav file and folders - playlist/shuffle).
- Time based commands like a reminder.
- Counter variables.
- Configurable points system with gambling and command pricing.
- Per-user cooldown.
- Feature sets (like PlayWithViewers' join, leave, list and position commands).
- Combine sound with other redeems (like mario invincibility theme while rgb is on).
- Assistant features like play animation when first time chatter appears.
- Command grouping, moving, editing.
- Called commands being able to disable/enable other commands.

## Known bugs/limitations
- Import only works once unless you refresh the page.
- Wrong credentials on the Twitch login doesn't give an error message.
- Navigation bar looks weird on narrow screen widths (<570px).
- Different characters aren't the same size/position when switching (implement offsets).
- Channel point redeems only work when it's a text based one.

## Building
Just clone the repo and run `npm install` on it (requires nodejs). You can run the app in development mode with `npm run start`.
To build it as an exe file, run `npm run make`. The first build will take about ~20 minutes because of nexe and its dependencies. The exe file will be in the `dist` folder.

The nexe building process also requires the following dependencies:
- Visual Studio with "Desktop development with C++" and its default selected optional stuff.
- [NASM](https://www.nasm.us/pub/nasm/releasebuilds/2.15.04/) (install as administrator).
- Python 3.8.5 (make sure python --version returns that version specifically).

## Contributions
Thanks to the beta testers:
- [FateMagnet](https://www.twitch.tv/fatemagnet)
- [sleepypurin](https://www.twitch.tv/sleepypurin)
- [hardcoremethaddict](https://www.twitch.tv/hardcoremethaddict)