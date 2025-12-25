class Room < ApplicationRecord
  # Associations
  belongs_to :room_type
  has_many :bookings, dependent: :restrict_with_error

  # Enums
  enum :status, { available: 0, occupied: 1, maintenance: 2, reserved: 3 }

  # Validations
  validates :number, presence: true, uniqueness: true
  validates :floor, presence: true, numericality: { only_integer: true }
  validates :status, presence: true
  validates :capacity, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

  # Scopes
  scope :available, -> { where(status: :available) }
  scope :on_floor, ->(floor) { where(floor: floor) }
end
