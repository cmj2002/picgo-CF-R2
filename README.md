# picgo-plugin-cloudflare-r2

PicGo plugin for [cmj2002/CF-R2-ImageBed](https://github.com/cmj2002/CF-R2-ImageBed)

## Configuration

There are 3 configuration options:

* `remoteURL`: the remote URL of the CF-R2-ImageBed Worker. Don't miss `https://` at beginning or `/` at the end.
* `secret` : the secret of the CF-R2-ImageBed Worker.
* `uploadPath`: the path of the uploaded images. That must be contained in the `allowPaths` in the config of Worker.

> The file you upload will be place at `/uploadPath/{year}/{month}/{date}{hour}{minute}{second}{i}.{extname}`, where `{i}` is the index if you upload multiple images at the same time.
