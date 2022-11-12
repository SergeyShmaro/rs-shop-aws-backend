const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.all('/*', async (req, res) => {
  const { method, path, originalUrl, body, headers } = req;
  const destination = path.split('/')[1];
  const targetEndpoint = process.env[destination];

  if (!targetEndpoint) {
    res.status(502).send({ message: 'Cannot process the request' });
    return;
  }

  try {
    // removing host because requests to aws fails when host contains localhost 
    const { host, ...headersWithoutHost } = headers;
    const response = await fetch(`${targetEndpoint}${originalUrl}`, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: headersWithoutHost,
    });

    const data = await response.text();

    let parsedData = data;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.log('Data is not in JSON format');
    }

    res.status(response.status).send(parsedData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`BFF app listening on port ${port}`)
});