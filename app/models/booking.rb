class Booking < ApplicationRecord
  # Associations
  belongs_to :room
  belongs_to :guest
  belongs_to :user
  has_many :booking_services, dependent: :destroy
  has_many :services, through: :booking_services
  has_many :payments, dependent: :destroy

  # Nested attributes
  accepts_nested_attributes_for :booking_services, allow_destroy: true

  # Enums
  enum :status, { pending: 0, confirmed: 1, checked_in: 2, checked_out: 3, cancelled: 4 }

  # Callbacks
  before_validation :calculate_total_price

  # Validations
  validates :check_in_date, presence: true
  validates :check_out_date, presence: true
  validates :number_of_guests, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :total_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :check_out_after_check_in
  validate :no_overlapping_bookings

  # Scopes
  scope :active, -> { where(status: [:pending, :confirmed, :checked_in]) }
  scope :for_date_range, ->(start_date, end_date) {
    where('check_in_date <= ? AND check_out_date >= ?', end_date, start_date)
  }

  private

  def calculate_total_price
    return unless check_in_date && check_out_date && room

    nights = (check_out_date - check_in_date).to_i
    return if nights <= 0

    base_price = room.room_type&.base_price || 0
    self.total_price = nights * base_price
  end

  def check_out_after_check_in
    return unless check_in_date && check_out_date

    if check_out_date <= check_in_date
      errors.add(:check_out_date, 'must be after check-in date')
    end
  end

  def no_overlapping_bookings
    return unless check_in_date && check_out_date && room
    return if will_save_change_to_status? && status == 'cancelled'

    # Check for overlapping bookings
    overlapping = Booking.where(room: room)
      .where.not(id: id) # Exclude current record
      .where(status: [:pending, :confirmed, :checked_in]) # Only active bookings
      .where('check_in_date < ? AND check_out_date > ?', check_out_date, check_in_date)

    if overlapping.exists?
      errors.add(:base, 'Room is already booked for selected dates')
    end
  end
end
