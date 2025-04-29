import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Fix __dirname issue in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all origins with proper options
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware with increased size limit for larger payloads
app.use(express.json({ limit: '10mb' }));

// Check if Python and required paths exist on startup
const pythonScriptPath = path.join(__dirname, './ml-backend/app.py');
const modelPath = path.join(__dirname, './ml-backend/model.pkl');

// Ensure ML backend directory exists
const mlBackendDir = path.join(__dirname, './ml-backend');
if (!fs.existsSync(mlBackendDir)) {
  fs.mkdirSync(mlBackendDir, { recursive: true });
  console.log(`Created ML backend directory: ${mlBackendDir}`);
}

// Check files on startup
if (!fs.existsSync(pythonScriptPath)) {
  console.log(`Warning: Python script not found at: ${pythonScriptPath}`);
  console.log('Please ensure the Python script is created at this location.');
}

if (!fs.existsSync(modelPath)) {
  console.log(`Warning: Model file not found at: ${modelPath}`);
  console.log('Please ensure the model.pkl file is in the ml-backend directory.');
}

// Make Python script executable if it exists
if (fs.existsSync(pythonScriptPath)) {
  try {
    fs.chmodSync(pythonScriptPath, '755');
    console.log('Made Python script executable');
  } catch (error) {
    console.warn('Could not make Python script executable:', error.message);
  }
}

// Helper function to detect Python command
function getPythonCommand() {
  // Try different Python commands to find one that works
  const commands = ['python', 'python3', 'py'];
  
  for (const cmd of commands) {
    try {
      const result = spawn(cmd, ['-c', 'print("Python test")']);
      return cmd;
    } catch (error) {
      continue;
    }
  }
  
  console.warn('Could not find a working Python command. Using "python" as default.');
  return 'python';
}

const pythonCommand = getPythonCommand();
console.log(`Using Python command: ${pythonCommand}`);

// ML prediction endpoint
app.post('/api/predict-nutriscore', (req, res) => {
  const nutritionData = req.body;
  console.log('Received nutrition data for prediction');

  // Validate required input
  if (!nutritionData) {
    return res.status(400).json({ error: 'No nutrition data provided' });
  }

  // Check for required fields
  const requiredFields = [
    'energy_100g', 'fat_100g', 'saturated-fat_100g',
    'carbohydrates_100g', 'sugars_100g', 'fiber_100g',
    'proteins_100g', 'salt_100g', 'sodium_100g'
  ];
  
  const missingFields = requiredFields.filter(field => 
    nutritionData[field] === undefined || nutritionData[field] === null || nutritionData[field] === ''
  );
  
  if (missingFields.length > 0) {
    console.warn(`Missing required nutrition fields: ${missingFields.join(', ')}`);
    // Continue with warning, but don't block prediction
  }

  // Simple fallback when Python ML is not available
  if (!fs.existsSync(pythonScriptPath) || !fs.existsSync(modelPath)) {
    console.log('ML infrastructure not ready, using fallback prediction');
    
    // Simple scoring algorithm as fallback
    let score = 0;
    
    // Negative points for high values
    score -= (parseFloat(nutritionData.energy_100g) || 0) / 100;
    score -= (parseFloat(nutritionData.fat_100g) || 0) * 2;
    score -= (parseFloat(nutritionData['saturated-fat_100g']) || 0) * 3;
    score -= (parseFloat(nutritionData.sugars_100g) || 0) * 2;
    score -= (parseFloat(nutritionData.salt_100g) || 0) * 10;
    
    // Positive points for high values
    score += (parseFloat(nutritionData.fiber_100g) || 0) * 2;
    score += (parseFloat(nutritionData.proteins_100g) || 0);
    
    // Determine grade
    let grade;
    if (score > 3) grade = 'A';
    else if (score > 0) grade = 'B';
    else if (score > -3) grade = 'C';
    else if (score > -6) grade = 'D';
    else grade = 'E';
    
    return res.json({ 
      nutrition_grade: grade,
      confidence: 70, // 70% confidence for fallback algorithm
      fallback: true // Indicate this was a fallback calculation
    });
  }

  // Run Python script for prediction
  try {
    console.log(`Executing Python script: ${pythonScriptPath}`);
    
    // Set timeout for Python process (30 seconds)
    const timeout = 30000;
    let timedOut = false;
    
    const pythonProcess = spawn(pythonCommand, [
      pythonScriptPath,
      JSON.stringify(nutritionData)
    ]);
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      pythonProcess.kill();
      console.error('Python process timed out after', timeout/1000, 'seconds');
      res.status(500).json({ 
        error: 'Python process timed out',
        fallback: true
      });
    }, timeout);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.error('Python error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      // Clear timeout since process completed
      clearTimeout(timeoutId);
      
      // If already responded due to timeout, don't continue
      if (timedOut) return;
      
      console.log(`Python process exited with code ${code}`);
      
      if (code !== 0) {
        console.error('Python process failed:', error);
        
        // Fall back to simple algorithm if Python fails
        let score = 0;
        
        // Negative points for high values
        score -= (parseFloat(nutritionData.energy_100g) || 0) / 100;
        score -= (parseFloat(nutritionData.fat_100g) || 0) * 2;
        score -= (parseFloat(nutritionData['saturated-fat_100g']) || 0) * 3;
        score -= (parseFloat(nutritionData.sugars_100g) || 0) * 2;
        score -= (parseFloat(nutritionData.salt_100g) || 0) * 10;
        
        // Positive points for high values
        score += (parseFloat(nutritionData.fiber_100g) || 0) * 2;
        score += (parseFloat(nutritionData.proteins_100g) || 0);
        
        // Determine grade
        let grade;
        if (score > 3) grade = 'A';
        else if (score > 0) grade = 'B';
        else if (score > -3) grade = 'C';
        else if (score > -6) grade = 'D';
        else grade = 'E';
        
        return res.json({ 
          nutrition_grade: grade,
          confidence: 65, // Lower confidence for error fallback
          fallback: true,
          error: `Python process failed with code ${code}`
        });
      }

      try {
        // Trim any whitespace from result
        result = result.trim();
        
        // Check if result is empty
        if (!result) {
          throw new Error('Empty result from Python script');
        }
        
        const prediction = JSON.parse(result);
        
        if (prediction.error) {
          console.error('Python prediction error:', prediction.error);
          
          // Log traceback if available
          if (prediction.traceback) {
            console.error('Python traceback:', prediction.traceback);
          }
          
          // Fall back to simple algorithm
          let score = 0;
          
          // Negative points for high values
          score -= (parseFloat(nutritionData.energy_100g) || 0) / 100;
          score -= (parseFloat(nutritionData.fat_100g) || 0) * 2;
          score -= (parseFloat(nutritionData['saturated-fat_100g']) || 0) * 3;
          score -= (parseFloat(nutritionData.sugars_100g) || 0) * 2;
          score -= (parseFloat(nutritionData.salt_100g) || 0) * 10;
          
          // Positive points for high values
          score += (parseFloat(nutritionData.fiber_100g) || 0) * 2;
          score += (parseFloat(nutritionData.proteins_100g) || 0);
          
          // Determine grade
          let grade;
          if (score > 3) grade = 'A';
          else if (score > 0) grade = 'B';
          else if (score > -3) grade = 'C';
          else if (score > -6) grade = 'D';
          else grade = 'E';
          
          return res.json({ 
            nutrition_grade: grade,
            confidence: 65, // Lower confidence for error fallback
            fallback: true,
            error: prediction.error
          });
        }
        
        // Add a timestamp to the prediction
        prediction.timestamp = new Date().toISOString();
        
        res.json(prediction);
      } catch (err) {
        console.error('Failed to parse Python output:', err);
        console.error('Raw output:', result);
        
        // Fall back to simple algorithm
        let score = 0;
        
        // Negative points for high values
        score -= (parseFloat(nutritionData.energy_100g) || 0) / 100;
        score -= (parseFloat(nutritionData.fat_100g) || 0) * 2;
        score -= (parseFloat(nutritionData['saturated-fat_100g']) || 0) * 3;
        score -= (parseFloat(nutritionData.sugars_100g) || 0) * 2;
        score -= (parseFloat(nutritionData.salt_100g) || 0) * 10;
        
        // Positive points for high values
        score += (parseFloat(nutritionData.fiber_100g) || 0) * 2;
        score += (parseFloat(nutritionData.proteins_100g) || 0);
        
        // Determine grade
        let grade;
        if (score > 3) grade = 'A';
        else if (score > 0) grade = 'B';
        else if (score > -3) grade = 'C';
        else if (score > -6) grade = 'D';
        else grade = 'E';
        
        return res.json({ 
          nutrition_grade: grade,
          confidence: 65, // Lower confidence for error fallback
          fallback: true,
          error: 'Failed to parse prediction output'
        });
      }
    });
  } catch (err) {
    console.error('Error starting Python process:', err);
    
    // Fall back to simple algorithm
    let score = 0;
    
    // Negative points for high values
    score -= (parseFloat(nutritionData.energy_100g) || 0) / 100;
    score -= (parseFloat(nutritionData.fat_100g) || 0) * 2;
    score -= (parseFloat(nutritionData['saturated-fat_100g']) || 0) * 3;
    score -= (parseFloat(nutritionData.sugars_100g) || 0) * 2;
    score -= (parseFloat(nutritionData.salt_100g) || 0) * 10;
    
    // Positive points for high values
    score += (parseFloat(nutritionData.fiber_100g) || 0) * 2;
    score += (parseFloat(nutritionData.proteins_100g) || 0);
    
    // Determine grade
    let grade;
    if (score > 3) grade = 'A';
    else if (score > 0) grade = 'B';
    else if (score > -3) grade = 'C';
    else if (score > -6) grade = 'D';
    else grade = 'E';
    
    return res.json({ 
      nutrition_grade: grade,
      confidence: 65, // Lower confidence for error fallback
      fallback: true,
      error: 'Failed to start Python process'
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    pythonPath: pythonScriptPath,
    modelPath: modelPath,
    pythonExists: fs.existsSync(pythonScriptPath),
    modelExists: fs.existsSync(modelPath),
    pythonCommand: pythonCommand
  });
});

// Python test endpoint
app.get('/api/test-python', (req, res) => {
  if (!fs.existsSync(pythonScriptPath)) {
    return res.status(404).json({ 
      error: 'Python script not found',
      path: pythonScriptPath
    });
  }
  
  try {
    const pythonProcess = spawn(pythonCommand, [
      pythonScriptPath,
      JSON.stringify({ test: true })
    ]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      res.json({
        success: code === 0,
        exitCode: code,
        output: result,
        error: error
      });
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to execute Python test',
      details: err.message
    });
  }
});

// Start server
const PORT =  5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`ML backend directory: ${mlBackendDir}`);
  console.log(`Python script path: ${pythonScriptPath} (exists: ${fs.existsSync(pythonScriptPath)})`);
  console.log(`Model path: ${modelPath} (exists: ${fs.existsSync(modelPath)})`);
});