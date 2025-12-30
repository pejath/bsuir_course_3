FactoryBot.define do
  factory :auth_token do
    association :user
    token { SecureRandom.hex(32) }
    device_info { "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    expires_at { 30.days.from_now }
    last_used_at { Time.current }
  end
end
