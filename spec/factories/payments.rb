FactoryBot.define do
  factory :payment do
    association :booking
    amount { Faker::Number.between(from: 50, to: 1000) }
    payment_method { :card }
    status { :completed }
    payment_date { Date.current }
    transaction_id { "txn_#{Faker::Alphanumeric.alphanumeric(number: 8).downcase}" }
    notes { Faker::Lorem.sentence }

    trait :pending do
      status { :pending }
    end

    trait :failed do
      status { :failed }
    end

    trait :refunded do
      status { :refunded }
    end

    trait :cash do
      payment_method { :cash }
    end

    trait :bank_transfer do
      payment_method { :bank_transfer }
    end

    trait :online do
      payment_method { :online }
    end
  end
end
