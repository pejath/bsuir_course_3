FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    email { Faker::Internet.email }
    password { "password123" }
    role { :guest }

    trait :admin do
      role { :admin }
    end

    trait :manager do
      role { :manager }
    end

    trait :staff do
      role { :staff }
    end
  end
end
