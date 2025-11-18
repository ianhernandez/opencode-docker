# OpenCode Workspace

This directory contains files that can be edited by the OpenCode AI through the API.

## Files

- **index.html** - Main HTML file served by the preview server
- **opencode.json** - Configuration for OpenCode tools and permissions

## Usage

Files in this directory are:
1. Shared as a Docker volume with the OpenCode server
2. Served live by the preview server at `http://localhost:8080`
3. Modified by OpenCode AI when receiving prompts through the backend API

Any changes made by OpenCode will be immediately visible in the live preview.
