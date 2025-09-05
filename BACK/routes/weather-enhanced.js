const express = require('express');
const axios = require('axios');
const router = express.Router();

// WEATHER BY LOCATION ENDPOINT
router.get('/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { units = 'metric', includeImage = 'false', includeForecast = 'false' } = req.query;
    
    if (!location || location.trim().length === 0) {
      return res.status(400).json({
        error: 'Location is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🌤️ Weather request:', {
      location: location,
      units: units,
      includeImage: includeImage,
      includeForecast: includeForecast
    });

    // Generate mock weather data
    const weatherData = generateMockWeatherData(location, units);
    
    // Generate weather image if requested
    if (includeImage === 'true') {
      try {
        const imagePrompt = `Beautiful weather scene for ${location}, ${weatherData.current.condition}, ${weatherData.current.description}, photorealistic, high quality`;
        const imageResponse = await axios.post('http://localhost:3001/api/pollinations/generate-image', {
          prompt: imagePrompt,
          width: 800,
          height: 600,
          model: 'flux',
          enhance: true
        });
        weatherData.image = imageResponse.data.imageUrl;
      } catch (error) {
        console.error('Weather image generation failed:', error.message);
      }
    }

    // Add forecast if requested
    if (includeForecast === 'true') {
      weatherData.forecast = generateMockForecast(location, units);
    }

    res.json(weatherData);

  } catch (error) {
    console.error('❌ Weather data error:', error.message);
    
    res.status(500).json({
      error: 'Weather data unavailable',
      message: 'Unable to fetch weather information at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// WEATHER SEARCH ENDPOINT
router.post('/search', async (req, res) => {
  try {
    const { query, units = 'metric', includeImage = false, includeForecast = false } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 Weather search request:', {
      query: query,
      units: units
    });

    // Extract location from query (simple parsing)
    const location = extractLocationFromQuery(query);
    const weatherData = generateMockWeatherData(location, units);
    weatherData.query = query;

    // Generate AI analysis of the weather query
    const analysisPrompt = `Analyze this weather query: "${query}" for location: ${location}. Provide helpful weather insights and recommendations.`;
    
    try {
      const analysisResponse = await axios.post('http://localhost:3001/api/pollinations/generate-text', {
        prompt: analysisPrompt
      });
      weatherData.analysis = analysisResponse.data.text || weatherData.analysis;
    } catch (error) {
      console.error('Weather analysis generation failed:', error.message);
    }

    // Generate weather image if requested
    if (includeImage) {
      try {
        const imagePrompt = `Weather scene for ${location}, ${weatherData.current.condition}, beautiful atmospheric photography`;
        const imageResponse = await axios.post('http://localhost:3001/api/pollinations/generate-image', {
          prompt: imagePrompt,
          width: 800,
          height: 600,
          model: 'flux',
          enhance: true
        });
        weatherData.image = imageResponse.data.imageUrl;
      } catch (error) {
        console.error('Weather image generation failed:', error.message);
      }
    }

    res.json(weatherData);

  } catch (error) {
    console.error('❌ Weather search error:', error.message);
    
    res.status(500).json({
      error: 'Weather search failed',
      message: 'Unable to search weather information at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// WEATHER FORECAST ENDPOINT
router.get('/:location/forecast', async (req, res) => {
  try {
    const { location } = req.params;
    const { days = '5', includeHourly = 'false' } = req.query;
    
    if (!location || location.trim().length === 0) {
      return res.status(400).json({
        error: 'Location is required',
        timestamp: new Date().toISOString()
      });
    }

    const numDays = Math.min(Math.max(parseInt(days) || 5, 1), 14);
    
    console.log('📅 Weather forecast request:', {
      location: location,
      days: numDays,
      includeHourly: includeHourly
    });

    const forecastData = {
      location: {
        name: location,
        coordinates: { lat: 40.7128, lon: -74.0060 },
        timezone: 'America/New_York'
      },
      forecast: generateMockForecast(location, 'metric', numDays),
      timestamp: new Date().toISOString()
    };

    if (includeHourly === 'true') {
      forecastData.hourly = generateMockHourlyForecast(location);
    }

    res.json(forecastData);

  } catch (error) {
    console.error('❌ Weather forecast error:', error.message);
    
    res.status(500).json({
      error: 'Weather forecast unavailable',
      message: 'Unable to fetch weather forecast at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// WEATHER ALERTS ENDPOINT
router.get('/:location/alerts', async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location || location.trim().length === 0) {
      return res.status(400).json({
        error: 'Location is required',
        timestamp: new Date().toISOString()
      });
    }

    console.log('⚠️ Weather alerts request:', { location });

    // Generate mock weather alerts
    const alerts = generateMockWeatherAlerts(location);

    res.json({
      location: location,
      alerts: alerts,
      alertCount: alerts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Weather alerts error:', error.message);
    
    res.status(500).json({
      error: 'Weather alerts unavailable',
      message: 'Unable to fetch weather alerts at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// UTILITY FUNCTIONS

function generateMockWeatherData(location, units) {
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Snow', 'Sunny'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  const tempBase = units === 'imperial' ? 70 : 20;
  const tempRange = units === 'imperial' ? 40 : 20;
  
  return {
    location: {
      name: location,
      coordinates: { 
        lat: (Math.random() - 0.5) * 180, 
        lon: (Math.random() - 0.5) * 360 
      },
      timezone: 'UTC',
      localTime: new Date().toISOString()
    },
    current: {
      temperature: Math.round(tempBase + (Math.random() - 0.5) * tempRange),
      feelsLike: Math.round(tempBase + (Math.random() - 0.5) * tempRange),
      humidity: Math.round(Math.random() * 100),
      pressure: Math.round(1000 + Math.random() * 50),
      visibility: Math.round(Math.random() * 20 + 5),
      uvIndex: Math.round(Math.random() * 11),
      wind: {
        speed: Math.round(Math.random() * 30),
        direction: Math.round(Math.random() * 360),
        directionText: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
      },
      condition: condition,
      description: `${condition.toLowerCase()} with comfortable conditions`
    },
    analysis: `Current weather in ${location} shows ${condition.toLowerCase()} conditions. The temperature is comfortable for outdoor activities. Wind conditions are moderate, and visibility is good.`,
    recommendations: [
      {
        type: 'clothing',
        icon: '👕',
        text: condition.includes('Rain') ? 'Bring an umbrella and wear waterproof clothing' : 'Light clothing recommended'
      },
      {
        type: 'activity',
        icon: '🏃',
        text: condition === 'Sunny' ? 'Great weather for outdoor activities' : 'Consider indoor activities if weather is severe'
      },
      {
        type: 'health',
        icon: '🌡️',
        text: 'Stay hydrated and protect yourself from UV rays'
      }
    ],
    timestamp: new Date().toISOString()
  };
}

function generateMockForecast(location, units, days = 5) {
  const forecast = [];
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Sunny'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const tempBase = units === 'imperial' ? 70 : 20;
    const tempRange = units === 'imperial' ? 30 : 15;
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      temperature: {
        high: Math.round(tempBase + Math.random() * tempRange),
        low: Math.round(tempBase - Math.random() * tempRange)
      },
      humidity: Math.round(Math.random() * 100),
      precipitation: Math.round(Math.random() * 100),
      wind: Math.round(Math.random() * 25)
    });
  }
  
  return forecast;
}

function generateMockHourlyForecast(location) {
  const hourly = [];
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy'];
  
  for (let i = 0; i < 24; i++) {
    const time = new Date();
    time.setHours(time.getHours() + i);
    
    hourly.push({
      time: time.toISOString(),
      temperature: Math.round(15 + Math.random() * 20),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      precipitation: Math.round(Math.random() * 50),
      wind: Math.round(Math.random() * 20)
    });
  }
  
  return hourly;
}

function generateMockWeatherAlerts(location) {
  const alertTypes = ['Heat Advisory', 'Thunderstorm Watch', 'Flood Warning', 'High Wind Advisory'];
  const alerts = [];
  
  // Randomly generate 0-2 alerts
  const numAlerts = Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numAlerts; i++) {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    alerts.push({
      id: `alert_${i + 1}`,
      type: alertType,
      severity: ['Minor', 'Moderate', 'Severe'][Math.floor(Math.random() * 3)],
      title: `${alertType} for ${location}`,
      description: `Weather alert issued for ${location}. Please take appropriate precautions and stay informed about changing conditions.`,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      areas: [location]
    });
  }
  
  return alerts;
}

function extractLocationFromQuery(query) {
  // Simple location extraction (in production, use more sophisticated NLP)
  const locationKeywords = ['weather in', 'temperature in', 'forecast for', 'climate in'];
  let location = query.toLowerCase();
  
  for (const keyword of locationKeywords) {
    if (location.includes(keyword)) {
      location = location.split(keyword)[1].trim();
      break;
    }
  }
  
  // Clean up the location
  location = location.replace(/[^\w\s,]/g, '').trim();
  
  return location || 'Unknown Location';
}

module.exports = router;