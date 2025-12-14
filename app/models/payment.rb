class Payment < ApplicationRecord
  # Associations
  belongs_to :booking

  # Enums
  enum :payment_method, { cash: 0, card: 1, bank_transfer: 2 }
  enum :status, { pending: 0, completed: 1, failed: 2, refunded: 3 }

  # Validations
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_method, presence: true
  validates :status, presence: true
end
