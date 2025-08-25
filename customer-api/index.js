const AWS = require('aws-sdk');
const express = require('express');
const cors = require('cors');
const app = express();
const docClient = new AWS.DynamoDB.DocumentClient();

app.use(cors());
app.use(express.json());

// GET last ride for a customer
app.get('/customer/:id/last-ride', async (req, res) => {
  const userId = req.params.id;

  const params = {
    TableName: 'CustomerRides',
    Key: { user_id: userId }
  };

  try {
    const data = await docClient.get(params).promise();
    res.json({
      date: data.Item?.last_ride_date || 'unknown',
      duration: data.Item?.last_ride_duration || 'unknown'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride info' });
  }
});

// Optional: Submit concern
app.post('/customer/:id/concerns', async (req, res) => {
  const userId = req.params.id;
  const { concern_text } = req.body;

  const params = {
    TableName: 'CustomerConcerns',
    Item: {
      user_id: userId,
      timestamp: new Date().toISOString(),
      concern_text,
      status: 'new'
    }
  };

  try {
    await docClient.put(params).promise();
    res.json({ message: 'Concern submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit concern' });
  }
});

module.exports = app;
