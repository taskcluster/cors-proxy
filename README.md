## CORS Proxy

[cors-proxy](https://github.com/taskcluster/cors-proxy) is a simple service
to enable taskcluster frontend services to make access remote endpoints that
disallow cross origin requests.

Any website under `taskcluster.net` domain can make remote requests through
cors-proxy.

### Making a request

cors-proxy exposes the `/request` endpoint. You make a POST request to this
endpoint and in the request body, you pass the remote website request
parameters, in [json](http://www.json.org/).

```javascript
$.ajax({
  url: 'http://cors-proxy.taskcluster.net/request',
  method: 'POST',
  contentType: 'application/json',
  data: {
    hostname: 'queue.taskcluster.net',
    path: '/v1/ping'
  }
}).done(function(res) {
  console.log(res);
});
```

The parameters accepted are the same as
[nodejs http.request](https://nodejs.org/api/http.html#http_http_request_options_callback).

Paramater    | Description
-------------|------------
Hostname     | The host name to connect with
path         | Endpoint
method       | One of the http standards [verbs](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)
port         | Port number to connect
headers      | Additional http headers to send.
data         | Body text.

cors-proxy will use the same protocol to connect as it received the requested at.
So, to make a new request on https, you have to use the url
`https://cors-proxy.taskcluster.net/request`.

