class Service < ApplicationRecord
  # Associations
  has_many :booking_services, dependent: :restrict_with_error
  has_many :bookings, through: :booking_services

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :active, -> { where(active: true) }
end
