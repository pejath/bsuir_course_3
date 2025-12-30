FactoryBot.define do
  factory :guest do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    email { Faker::Internet.email }
    phone { Faker::PhoneNumber.phone_number }
    passport_number { Faker::Alphanumeric.alphanumeric(number: 8).upcase }
    date_of_birth { Faker::Date.birthday(min_age: 18, max_age: 80) }
    country { Faker::Address.country }
    notes { Faker::Lorem.sentence }
  end
end
