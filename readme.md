# DOSI
DOSI Auto Claim DON & Join Adventure

## Installation
- Clone this repository
```bash
# clone this repository
git clone https://github.com/xrizkiiaprmn/dosi
# after complete
cd dosi
```
- Install library
```bash
# use
yarn

# or
npm i
```

## Usage
- First configure automation in file configuration.json
```javascript
{
    "enableWebhook": false, // On or Off Discord Webhook Logs
    "webhookUrl": "webhook-url-here", // Webhook of Discord Channel to receive Logs Automation | Fill if enableWebhook is true, leave it if false
    "sessions": ["session1-here", "session2-here", "etc"] // Multiple session account
}
```
- After configure, just run
```bash
# use
yarn start

# or
npm run start
```
- Done, auto claim every 24 Hours
- Please give me stars