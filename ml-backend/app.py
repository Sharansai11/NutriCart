#!/usr/bin/env python3
import sys
import json
import pickle
import numpy as np
import os
import traceback
import warnings
import pandas as pd

# Suppress XGBoost warnings
warnings.filterwarnings('ignore', category=UserWarning)

# Import XGBoost
import xgboost as xgb

# Custom JSON encoder to handle NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

def log_to_stderr(message):
    """Log messages to stderr so they don't interfere with stdout JSON output"""
    print(message, file=sys.stderr)

def load_model_safely(model_path):
    """
    Safely load the model with multiple fallback methods
    """
    try:
        # First, try loading with XGBoost's native method
        booster = xgb.Booster()
        booster.load_model(model_path.replace('.pkl', '.xgb'))
        return booster
    except Exception as xgb_load_error:
        try:
            # If XGBoost native loading fails, fall back to pickle
            with open(model_path, 'rb') as file:
                combined_model = pickle.load(file)
                
                # If it's a dictionary-style saved model
                if isinstance(combined_model, dict) and 'model' in combined_model:
                    model = combined_model['model']
                    
                    # If the model is an XGBoost model, save it in XGBoost format
                    if hasattr(model, 'save_model'):
                        model.save_model(model_path.replace('.pkl', '.xgb'))
                    
                    return combined_model
                
                return combined_model
        except Exception as pickle_load_error:
            # Log both errors for debugging
            log_to_stderr(f"XGBoost Load Error: {xgb_load_error}")
            log_to_stderr(f"Pickle Load Error: {pickle_load_error}")
            raise RuntimeError("Could not load the model using any method")

def predict_nutriscore(data):
    try:
        # Check if model exists
        model_path = './ml-backend/model.pkl'
        if not os.path.exists(model_path):
            return {
                "error": f"Model file not found at {model_path}"
            }
        
        try:
            # Load the model using the new safe loading method
            combined_model = load_model_safely(model_path)
        except ModuleNotFoundError as module_error:
            if "xgboost" in str(module_error):
                return {
                    "nutrition_grade": "c",  # Default fallback value
                    "confidence": 65,
                    "fallback": True,
                    "error": f"Missing module: {str(module_error)}. Please install with 'pip install xgboost'"
                }
            else:
                # Re-raise if it's not an xgboost issue
                raise
        
        # Handle different model loading scenarios
        if isinstance(combined_model, dict):
            model = combined_model['model']
            label_encoder = combined_model.get('label_encoder')
            features = combined_model.get('features', [])
        else:
            # If loaded directly as a Booster
            model = combined_model
            label_encoder = None
            # For XGBoost Booster, we need to extract feature names
            if isinstance(model, xgb.Booster):
                try:
                    # Try to get feature names from model
                    features = model.feature_names
                    if not features:
                        # Fallback feature list based on the error message
                        features = [
                            'energy_100g', 'fat_100g', 'saturated-fat_100g', 
                            'carbohydrates_100g', 'sugars_100g', 'fiber_100g', 
                            'proteins_100g', 'salt_100g', 'sodium_100g', 'iron_100g', 
                            'additives_n', 'ingredients_text_length', 
                            'additives_text_length', 'nutrition-score-fr_100g'
                        ]
                except:
                    # Fallback feature list based on the error message
                    features = [
                        'energy_100g', 'fat_100g', 'saturated-fat_100g', 
                        'carbohydrates_100g', 'sugars_100g', 'fiber_100g', 
                        'proteins_100g', 'salt_100g', 'sodium_100g', 'iron_100g', 
                        'additives_n', 'ingredients_text_length', 
                        'additives_text_length', 'nutrition-score-fr_100g'
                    ]
        
        # Debug logs to stderr
        log_to_stderr(f"Model type: {type(model)}")
        log_to_stderr(f"Features: {features}")
        
        # Prepare input data
        input_data = {}
        
        # Process each feature the model expects
        for feature in features:
            if feature == 'nutrition-score-fr_100g':
                # This feature isn't available in input, use a default value
                input_data[feature] = 0
            elif feature == 'ingredients_text_length':
                # Calculate text length from ingredients
                if 'ingredients_text' in data and data['ingredients_text']:
                    input_data[feature] = len(str(data['ingredients_text']))
                else:
                    input_data[feature] = 0
            elif feature == 'additives_text_length':
                # Calculate text length from additives
                if 'additives' in data and data['additives']:
                    input_data[feature] = len(str(data['additives']))
                else:
                    input_data[feature] = 0
            elif feature == 'additives_n':
                # Number of additives
                if 'additives' in data and data['additives']:
                    additives_text = str(data['additives'])
                    # Count additive items by splitting on commas
                    input_data[feature] = len(additives_text.split(','))
                else:
                    input_data[feature] = 0
            else:
                # For all other numeric features, use provided value or default to 0
                try:
                    value = data.get(feature, 0)
                    # Handle empty strings or None
                    if value == '' or value is None:
                        value = 0
                    input_data[feature] = float(value)
                except (ValueError, TypeError) as e:
                    input_data[feature] = 0.0
        
        # Ensure all features are present
        for feature in features:
            if feature not in input_data:
                input_data[feature] = 0.0
        
        # Check the type of model to determine prediction method
        if isinstance(model, xgb.Booster):
            # For XGBoost Booster, create a DataFrame with feature names
            input_df = pd.DataFrame([input_data], columns=features)
            log_to_stderr(f"Input data for DMatrix: {input_df.to_dict('records')}")
            
            # Convert to DMatrix with feature names
            dmatrix = xgb.DMatrix(input_df)
            
            # Make prediction
            y_pred_proba = model.predict(dmatrix)
            log_to_stderr(f"Raw prediction: {y_pred_proba}")
            
            # Handle predictions based on the output format
            if len(y_pred_proba.shape) == 1:
                if y_pred_proba.shape[0] > 1:  # Multi-class output as array
                    predicted_class_idx = int(np.argmax(y_pred_proba))
                    confidence = float(y_pred_proba[predicted_class_idx] * 100)
                else:  # Binary classification or regression
                    # For regression, just return the value
                    # For binary, convert to class (threshold at 0.5)
                    predicted_class_idx = 1 if y_pred_proba[0] > 0.5 else 0
                    confidence = float(abs(y_pred_proba[0] - 0.5) * 200)  # Scale to 0-100%
            else:  # Multi-class prediction with multiple samples
                predicted_class_idx = int(np.argmax(y_pred_proba, axis=1)[0])
                confidence = float(y_pred_proba[0, predicted_class_idx] * 100)
            
            log_to_stderr(f"Predicted class index: {predicted_class_idx}, Confidence: {confidence}")
            
            # Map class index to grade if no label encoder
            if not label_encoder:
                # Map from index to grade (adjust based on your model's classes)
                grade_map = {0: 'a', 1: 'b', 2: 'c', 3: 'd', 4: 'e'}
                nutrition_grade = grade_map.get(predicted_class_idx, 'c')
            else:
                try:
                    nutrition_grade = label_encoder.inverse_transform([predicted_class_idx])[0]
                    if isinstance(nutrition_grade, np.ndarray):
                        nutrition_grade = nutrition_grade.item()
                except:
                    # Fallback if label encoder fails
                    nutrition_grade = chr(ord('a') + predicted_class_idx)
        else:
            # For scikit-learn type models
            # Create input array in the correct order expected by the model
            X = np.array([[input_data[f] for f in features]])
            
            # Make prediction
            y_pred = model.predict(X)
            y_pred_proba = model.predict_proba(X) if hasattr(model, 'predict_proba') else None
            
            # Get predicted class and confidence
            predicted_class_idx = int(y_pred[0])
            
            if y_pred_proba is not None:
                confidence = float(y_pred_proba[0][predicted_class_idx] * 100)
            else:
                confidence = 90.0  # Default confidence if not available
            
            # Map back to original label
            if label_encoder:
                nutrition_grade = label_encoder.inverse_transform([predicted_class_idx])[0]
                if isinstance(nutrition_grade, np.ndarray):
                    nutrition_grade = nutrition_grade.item()
            else:
                # Fallback if no label encoder
                grade_map = {0: 'a', 1: 'b', 2: 'c', 3: 'd', 4: 'e'}
                nutrition_grade = grade_map.get(predicted_class_idx, 'c')
        
        return {
            "nutrition_grade": str(nutrition_grade).lower(),  # Ensure it's a lowercase string
            "confidence": round(confidence, 2)
        }
    except Exception as e:
        # Get full traceback for debugging
        error_traceback = traceback.format_exc()
        log_to_stderr(f"Error during prediction: {str(e)}")
        log_to_stderr(f"Traceback: {error_traceback}")
        return {
            "error": str(e),
            "traceback": error_traceback,
            "nutrition_grade": "c",  # Provide fallback values
            "confidence": 50,
            "fallback": True
        }

if __name__ == "__main__":
    # Read input data from command line argument
    if len(sys.argv) > 1:
        try:
            # Parse JSON input
            input_json = sys.argv[1]
            input_data = json.loads(input_json)
            
            # Get prediction
            result = predict_nutriscore(input_data)
            
            # Return result as JSON (using custom encoder for NumPy types)
            # ONLY print the JSON result to stdout, nothing else
            print(json.dumps(result, cls=NumpyEncoder))
        except json.JSONDecodeError as e:
            print(json.dumps({
                "error": f"Invalid JSON input: {e}",
                "input_sample": sys.argv[1][:100] if len(sys.argv) > 1 else "None",
                "nutrition_grade": "c",  # Provide fallback values
                "confidence": 50,
                "fallback": True
            }))
        except Exception as e:
            error_traceback = traceback.format_exc()
            print(json.dumps({
                "error": str(e),
                "traceback": error_traceback,
                "nutrition_grade": "c",  # Provide fallback values
                "confidence": 50,
                "fallback": True
            }))
    else:
        print(json.dumps({
            "error": "No input data provided",
            "nutrition_grade": "c",  # Provide fallback values
            "confidence": 50,
            "fallback": True
        }))