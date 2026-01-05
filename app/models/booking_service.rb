class BookingService < ApplicationRecord
  # Associations
  belongs_to :booking
  belongs_to :service

  # Callbacks
  before_validation :set_price_from_service

  # Validations
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  private

  def set_price_from_service
    self.price = service.price if service && price.blank?
  end
end
