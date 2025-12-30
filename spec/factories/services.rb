FactoryBot.define do
  factory :service do
    name { Faker::Lorem.words(number: 2).join(' ').capitalize }
    description { Faker::Lorem.paragraph(sentence_count: 2) }
    price { Faker::Number.between(from: 5, to: 100) }
    active { true }
  end
end
