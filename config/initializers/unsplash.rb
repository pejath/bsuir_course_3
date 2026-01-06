# frozen_string_literal: true

# Configure Unsplash API
Unsplash.configure do |config|
  config.application_access_key = Rails.application.credentials.unsplash[:access_key] if Rails.application.credentials.unsplash&.access_key
  config.application_secret = Rails.application.credentials.unsplash[:secret_key] if Rails.application.credentials.unsplash&.secret_key
  config.utm_source = "hotel_management_app"
end
