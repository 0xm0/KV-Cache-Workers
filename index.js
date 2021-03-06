addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Set up a base URL where our production traffic lives
const prodHost = "domain.com"

// Cache length for assets, in seconds
const expireTTL = 60

// Set DEBUG to true to return error messages as the response
const DEBUG = false

async function handleRequest(request) {
  try {
    // Get URL from request and store it as an instance of URL
    // https://developer.mozilla.org/en-US/docs/Web/API/URL
    let url = new URL(request.url)

    // Replace the host in the original request with our production
    // host, which will route any requests to our production endpoints
    // e.g. "https://example.com/my-path" => "https://yourdomain.com/my-path"
    url.host = prodHost

    // Get cached response based on URL from KV
    // e.g. "https://yourdomain.com/tag/newsletter"
    const kvResponse = await KV_CACHE.get(url.toString())

    if (kvResponse) {
      // Parse cached response from KV
      const { body, headers, status, statusText } = JSON.parse(kvResponse)

      // Construct a new response with the body, headers, and status/statusText from KV
      const cachedResp = new Response(body, {
        headers: JSON.parse(headers),
        status,
        statusText
      })
      return cachedResp
    } else {
      // Get response from production
      const resp = await fetch(url.toString())

      // Clone the response into a new variable so we can query and modify it
      const cloneResp = resp.clone()

      // Set up a new headers object, based on the stringified data from KV,
      // and add `X-Workers-Simple-Cache` to true, to indicate the data was
      // cached by this application. Optionally, add other headers here,
      // before sending back to the client.
      const headers = Object.assign(Object.fromEntries(cloneResp.headers), {
        'X-Workers-Cache': true
      })

      // Prepare the response data to be persisted in KV
      const respForCache = {
        body: await cloneResp.text(),
        headers: JSON.stringify(headers),
        status: cloneResp.status,
        statusText: cloneResp.statusText
      }

      // Cache the response in Workers KV, and expire it in a configured number of seconds
      await KV_CACHE.put(
        url.toString(),
        JSON.stringify(respForCache),
        { expireTTL }
      )

      // Replace with the below line to cache indefinitely. Note that this will require
      // manual purging of KV keys, either via our UI, wrangler (`wrangler kv:key delete`),
      // or a cron trigger
      // await KV_CACHE.put(url.toString(), JSON.stringify(respForCache))

      // Return the response to the client
      return resp
    }
  } catch (err) {
    if (DEBUG) {
      return new Response(err.toString(), { status: 500 })
    } else {
      return new Response("oops", { status: 500 })
    }
  }
}
