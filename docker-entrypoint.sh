#!/bin/bash
set -e

# Default region if not specified
DEFAULT_REGION=${AWS_REGION:-ap-southeast-1}
DEFAULT_OUTPUT=${AWS_OUTPUT:-json}

# Function to configure AWS profile
configure_profile() {
    local profile_name=$1
    local access_key=$2
    local secret_key=$3
    local region=$4
    local output=$5

    if [ -n "$access_key" ] && [ -n "$secret_key" ]; then
        echo "Configuring profile: $profile_name"
        aws configure set aws_access_key_id "$access_key" --profile "$profile_name"
        aws configure set aws_secret_access_key "$secret_key" --profile "$profile_name"
        aws configure set region "${region:-$DEFAULT_REGION}" --profile "$profile_name"
        aws configure set output "${output:-$DEFAULT_OUTPUT}" --profile "$profile_name"
    else
        echo "Warning: Missing credentials for profile $profile_name. Skipping configuration."
        echo "Access Key present: $([ -n "$access_key" ] && echo "Yes" || echo "No")"
        echo "Secret Key present: $([ -n "$secret_key" ] && echo "Yes" || echo "No")"
    fi
}

echo "Starting Docker Entrypoint..."
echo "Current User: $(whoami)"
echo "AWS_PROFILE=$AWS_PROFILE"

# Configure Profiles from Environment Variables
# Using env vars AWS_ACCESS_KEY_ID_PROD, AWS_SECRET_ACCESS_KEY_PROD
configure_profile "aws_prod" "$AWS_ACCESS_KEY_ID_PROD" "$AWS_SECRET_ACCESS_KEY_PROD"
configure_profile "aws_nonprod" "$AWS_ACCESS_KEY_ID_NONPROD" "$AWS_SECRET_ACCESS_KEY_NONPROD"

# Execute the passed command
exec "$@"
