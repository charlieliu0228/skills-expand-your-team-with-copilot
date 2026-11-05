# Mergington High School Activities

A super simple website application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Share activities through Facebook, X, WhatsApp, or a direct link

## Sharing an activity

Use the sharing buttons at the bottom of any activity card; no login is needed.
Facebook, X, and WhatsApp open their sharing page in a new tab so you can choose
who receives the activity. On supported devices, **Share...** opens your device's
sharing menu.

Choose **Copy link** to send a link through any messaging app. If automatic copying
is unavailable, select and copy the link shown below the buttons. The link opens
the activities page with that activity's name in the search box. Clear the search
to browse all activities again.

Shares include only the activity's public name, description, schedule, and link
(Facebook receives only the link), never student emails or teacher login details.
Social services are contacted only when you choose their sharing button.
Use the school's published website address when sharing; a localhost link only
works on your own computer.

## Development Guide

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).

Run the sharing checks with Node.js (no additional packages needed):

```bash
node --test src/tests/sharing.test.js
```
