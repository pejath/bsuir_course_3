class Booking < ApplicationRecord
  # Associations
  belongs_to :room
  belongs_to :guest
  belongs_to :user
  has_many :booking_services, dependent: :destroy
  has_many :services, through: :booking_services
  has_many :payments, dependent: :destroy

  # Enums
  enum :status, { pending: 0, confirmed: 1, checked_in: 2, checked_out: 3, cancelled: 4 }

  # Validations
  validates :check_in_date, presence: true
  validates :check_out_date, presence: true
  validates :number_of_guests, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :total_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :check_out_after_check_in

  # Scopes
  scope :active, -> { where(status: [:pending, :confirmed, :checked_in]) }
  scope :for_date_range, ->(start_date, end_date) {
    where('check_in_date <= ? AND check_out_date >= ?', end_date, start_date)
  }

  private

  def check_out_after_check_in
    return unless check_in_date && check_out_date

    if check_out_date <= check_in_date
      errors.add(:check_out_date, 'must be after check-in date')
    end
  end
end
