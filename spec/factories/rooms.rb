FactoryBot.define do
  factory :room do
    association :room_type
    number { Faker::Number.unique.number(digits: 3).to_s }
    floor { Faker::Number.between(from: 1, to: 10) }
    status { :available }
    capacity { Faker::Number.between(from: 1, to: 4) }
    description { Faker::Lorem.paragraph(sentence_count: 2) }
    amenities { Faker::Lorem.words(number: 4).join(', ') }
    view { Faker::Lorem.word.capitalize }
    image_url { Faker::Internet.url(host: 'dummyimage.com', path: "/800x600/000/ffffff") }
    
    trait :occupied do
      status { :occupied }
    end
    
    trait :maintenance do
      status { :maintenance }
    end
    
    trait :reserved do
      status { :reserved }
    end
  end
end
