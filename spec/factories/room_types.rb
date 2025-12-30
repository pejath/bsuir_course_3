FactoryBot.define do
  factory :room_type do
    name { Faker::Lorem.words(number: 2).join(' ').capitalize }
    description { Faker::Lorem.paragraph(sentence_count: 2) }
    capacity { Faker::Number.between(from: 1, to: 4) }
    base_price { Faker::Number.between(from: 50, to: 500) }
  end
end
