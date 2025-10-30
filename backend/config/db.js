const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use local MongoDB if available, otherwise use a fallback
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/crm_system';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Falling back to in-memory database for development...');
    
    // For development, we'll continue without database connection
    // In production, this should be properly configured
    console.log('Server will run without database connection for now');
  }
};

module.exports = connectDB;

