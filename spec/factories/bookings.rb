FactoryBot.define do
  factory :booking do
    association :room
    association :guest
    association :user
    check_in_date { 1.day.from_now }
    check_out_date { 3.days.from_now }
    number_of_guests { Faker::Number.between(from: 1, to: 4) }
    total_price { 200.00 }
    status { :pending }
    notes { Faker::Lorem.sentence }
    
    trait :confirmed do
      status { :confirmed }
    end
    
    trait :checked_in do
      status { :checked_in }
      check_in_date { 1.day.ago }
    end
    
    trait :checked_out do
      status { :checked_out }
      check_in_date { 5.days.ago }
      check_out_date { 3.days.ago }
    end
    
    trait :cancelled do
      status { :cancelled }
    end
  end
end
