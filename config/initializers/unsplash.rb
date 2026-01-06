# frozen_string_literal: true

# Configure Unsplash API
Unsplash.configure do |config|
  config.application_access_key = ENV["ACCESS_KEY"]
  config.application_secret = ENV["SECRET_KEY"]
  config.utm_source = "hotel_management_app"
end
