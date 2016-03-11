## CORS Proxy

[cors-proxy](https://github.com/taskcluster/cors-proxy) is a simple service
to enable taskcluster frontend services to make access remote endpoints that
disallow cross origin requests.

Any website under `taskcluster.net` domain can make remote requests through
cors-proxy.

### Making a request

cors-proxy exposes the `/request` endpoint. You make a POST request to this
endpoint and in the request body, you pass the remote website request
parameters, in [json](http://www.json.org/) format.

```javascript
$.ajax({
  url: 'http://cors-proxy.taskcluster.net/request',
  method: 'POST',
  contentType: 'application/json',
  data: {
    url: 'https://queue.taskcluster.net/v1/ping',
  }
}).done(function(res) {
  console.log(res);
});
```

The request accepts the following parameters, from which only `url` is required.

Paramater            | Description
---------------------|------------
url                  | Remote URL to connect to
method               | One of the http standards [verbs](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)
headers              | Additional http headers to send
data                 | Body text
rejectUnauthorized   | Reject if the https certifcate is not valid. Default: `true`.

