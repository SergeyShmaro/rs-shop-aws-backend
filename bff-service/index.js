const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let productsCache = {};

const cacheResponse = (status, data) => {
  productsCache = { status, data };
  setTimeout(() => {
    productsCache = {};
  }, 120000);
}

app.all('/*', async (req, res) => {
  const { method, path, originalUrl, body, headers } = req;
  const destination = path.split('/')[1];
  const targetEndpoint = process.env[destination];

  if (!targetEndpoint) {
    res.status(502).send({ message: 'Cannot process the request' });
    return;
  }

  const shouldUseCache = path === '/products' && method.toUpperCase() === 'GET';

  if (shouldUseCache && productsCache.data) {
    res.status(productsCache.status).send(productsCache.data);
    return;
  }

  try {
    // removing host because requests to aws fails when host contains localhost 
    const { host, ...headersWithoutHost } = headers;
    const response = await fetch(`${targetEndpoint}${originalUrl}`, {
      method,
      ...(Object.keys(body).length !== 0 ? { body: JSON.stringify(body) } : {}),
      headers: headersWithoutHost,
    });

    const data = await response.text();

    let parsedData = data;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.log('Data is not in JSON format');
    }

    if (shouldUseCache) cacheResponse(response.status, parsedData);

    res.status(response.status).send(parsedData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`BFF app listening on port ${port}`)
});