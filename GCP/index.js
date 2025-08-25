// const { Firestore } = require('@google-cloud/firestore');
// const axios = require('axios');

// const firestore = new Firestore();

// exports.dialogflowWebhook = async (req, res) => {
//   const intent = req.body.queryResult.intent.displayName;
//   const params = req.body.queryResult.parameters;

//   console.log("🟢 Intent triggered:", intent);
//   console.log("🟢 Params received:", JSON.stringify(params));

//   if (intent === 'GetUserInfo') {
//     const userId = params.user_id;
//     console.log("🔎 Looking up user:", userId);

//     try {
//       const apiResponse = await axios.get(`https://szcaaa1ro1.execute-api.us-east-1.amazonaws.com/prod/user?user_id=abc123`);
//       console.log("✅ API Response:", JSON.stringify(apiResponse.data));

//       const user = apiResponse.data;
//       return res.json({
//         fulfillmentText: `User ${user.name} has ${user.points} ride points.`
//       });
//     } catch (err) {
//       console.error("❌ AWS API error:", err.message || err);
//       return res.json({
//         fulfillmentText: `Sorry, I couldn't fetch the user info.`
//       });
//     }
//   }

//   return res.json({ fulfillmentText: "Intent not handled." });
// };



const axios = require('axios');

exports.dialogflowWebhook = async (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  const params = req.body.queryResult.parameters;

  console.log("🔁 Intent:", intent);
  console.log("📦 Params:", JSON.stringify(params));

  try {
    if (intent === 'GetUserInfo') {
      const userId = params.user_id;
      console.log("🔍 Calling user API for:", userId);

      const response = await axios.get(`https://szcaaa1ro1.execute-api.us-east-1.amazonaws.com/prod/user?user_id=abc123`);
      const user = response.data;

      return res.json({
        fulfillmentText: `User ${user.name} has ${user.points} ride points.`
      });
    }

    if (intent === 'GetTripInfo') {
      const tripId = params.trip_id;
      console.log("🔍 Calling trip API for:", tripId);

      const response = await axios.get(`https://szcaaa1ro1.execute-api.us-east-1.amazonaws.com/prod/trip?trip_id=trip001`);
      const trip = response.data;

      return res.json({
        fulfillmentText: `Trip ${trip.trip_id} started at ${trip.start_time} and ended at ${trip.end_time}. Distance covered: ${trip.distance_km} km.`
      });
    }

    if (intent === 'GetScooterLocation') {
      const scooterId = params.scooter_id;
      console.log("🔍 Calling scooter API for:", scooterId);

      const response = await axios.get(`https://szcaaa1ro1.execute-api.us-east-1.amazonaws.com/prod/scooter?scooter_id=sct100`);
      const scooter = response.data;

      return res.json({
        fulfillmentText: `Scooter ${scooter.scooter_id} is located at ${scooter.location} and has ${scooter.battery_level}% battery remaining.`
      });
    }

    // Fallback
    return res.json({ fulfillmentText: "Intent not recognized or not handled yet." });

  } catch (error) {
    console.error("❌ Error calling AWS API:", error.message);
    return res.json({
      fulfillmentText: "Sorry, I couldn't fetch the requested data right now."
    });
  }
};
