class Guest < ApplicationRecord
  # Associations
  has_many :bookings

  # Callbacks
  before_destroy :check_and_update_bookings

  # Validations
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, presence: true
  validates :passport_number, presence: true
  validate :date_of_birth_not_in_future

  # Custom validation for deletion
  def can_be_deleted?
    active_bookings.empty?
  end

  def active_bookings
    bookings.where(status: [:pending, :confirmed, :checked_in])
  end

  def date_of_birth_not_in_future


    
    return unless date_of_birth.present?
    
    if date_of_birth > Date.current
      errors.add(:date_of_birth, :in_future)
    end
  end

  private

  def check_and_update_bookings
    # Don't allow deletion if there are active bookings
    if active_bookings.exists?
      errors.add(:base, "Cannot delete guest with active bookings")
      throw :abort
    end
    
    # Update inactive bookings to set guest_id to null
    bookings.where.not(status: [:pending, :confirmed, :checked_in]).update_all(guest_id: nil)
  end
end
