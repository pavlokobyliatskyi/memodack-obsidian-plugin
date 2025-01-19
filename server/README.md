# Server

In the plugin settings for the `Server` option, there are two variants: `Free` and `Personal`.

## Free

This variant allows you to translate and convert text to speech. However, text-to-speech works only on desktop. On mobile devices, it plays audio only from the cache.

## Personal

The repository contains a `server` directory with everything you need.

### AWS Lambda

Instructions will be provided soon.

### Locally

To set up the server locally, follow these steps:

```bash
git clone --depth 1 https://github.com/some-username/some-repo
cd some-repo/server/
```

Alternatively, you can manually download the `server.py` and `requirements.txt` files.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

You can change the default `X_API_KEY` in the `server.py` file. Connection details will be displayed in the terminal after running the server.

```bash
python server.py
```
