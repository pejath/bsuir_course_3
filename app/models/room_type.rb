class RoomType < ApplicationRecord
  # Associations
  has_many :rooms, dependent: :restrict_with_error

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :capacity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :base_price, presence: true, numericality: { greater_than: 0 }
end
