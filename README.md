# README

## About

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

### Pre-requisites

- MacOs

- Running Postgresql on PORT=`5432`

- go `v1.25.0` or later

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

<img width="1437" height="867" alt="image" src="https://github.com/user-attachments/assets/91002090-c4c6-4732-b1b9-01725a91d4d3" />
