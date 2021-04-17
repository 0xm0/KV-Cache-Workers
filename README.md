# KV-Cache-Workers
Serve HTML pages from Cloudflare's edge using Workers KV 

## Installation

```
$ wrangler generate https://github.com/0xm0/KV-Cache-Workers
```


## Configuration

1. Configure `account_id` and `kv_namespaces` in `wrangler.toml`
2. Update `prodHost` to a known production host that you'd like to proxy and cache traffic from
3. Customize `expireTTL` to a number of seconds to cache data for. _Note: this value must be 60 seconds or longer._
4. (Optionally) Set `DEBUG` to `true` to have error messages returned from the Workers function.

## Testing

Run `wrangler dev` locally, and issue requests to `localhost:8787` -- e.g. `curl localhost:8787/about`.

## Publish

```
$ wrangler publish
```
