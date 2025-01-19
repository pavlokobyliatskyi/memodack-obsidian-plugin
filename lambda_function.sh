#!/bin/bash

# Navigate to the lambda_function directory
cd server/lambda_function/ || { echo "Directory not found"; exit 1; }

# Remove existing lambda_function.zip if it exists
if [ -f lambda_function.zip ]; then
    rm lambda_function.zip || { echo "Failed to remove existing zip archive"; exit 1; }
fi

# Install the required packages into the venv directory
pip install -r ../requirements.txt --target=venv || { echo "Failed to install requirements"; exit 1; }

# Navigate to the venv directory
cd venv/ || { echo "Directory not found"; exit 1; }

# Create a zip archive of the contents of the venv directory
zip -r ../lambda_function.zip . || { echo "Failed to create zip archive"; exit 1; }

# Navigate back to the lambda_function directory
cd .. || { echo "Directory not found"; exit 1; }

# Update the zip archive with the lambda_function.py file
zip -u lambda_function.zip lambda_function.py || { echo "Failed to add file to zip archive"; exit 1; }

# Remove the venv directory
rm -rf venv || { echo "Failed to remove venv directory"; exit 1; }

echo "Zip archive created successfully: server/lambda_function/lambda_function.zip"
